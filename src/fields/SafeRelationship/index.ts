import type { Payload } from 'payload'
import type { SanitizedConfig } from 'payload/config'
import type {
  PayloadRequest,
  RelationshipField,
  RelationshipValue,
  TypeWithID,
  Validate,
} from 'payload/types'

type MaybeScheduledDoc = TypeWithID & Record<string, unknown> & {
  _status?: 'published' | 'draft'
  publish_date?: string

}

/**
 * Wrapper around the default `RelationshipField` that ensures "related" documents are published before the primary document
 */
export const SafeRelationship: (
  props: Omit<RelationshipField, 'type'>,
) => RelationshipField = (props) => {
  const validate: Validate<RelationshipValue> = async (
    value,
    options,
  ): Promise<string | true> => {
    // first run user validate fn
    if (props.validate) {
      const validateRes = await props.validate(value, options)
      if (validateRes !== true) {
        return validateRes
      }
    }

    const {
      config,
      data,
      payload,
      req,
    }: { config: SanitizedConfig; data: MaybeScheduledDoc; payload?: Payload, req?: PayloadRequest } = options

    // can't run on the client
    if (!payload) {
      return true
    }
    
    // abort if the field is empty
    if (!value || Array.isArray(value) && value.length === 0) {
      return true
    }

    // abort if the current document is an unscheduled draft
    if (data?._status === 'draft' && !data?.publish_date) {
      return true
    }

    // cast relationTo to an array
    const relationsTo = Array.isArray(props.relationTo)
      ? props.relationTo
      : [props.relationTo]

    // cast value to an array
    const values = Array.isArray(value) ? value : [value]

    // build a list of collections we need to check draft status for
    // format: { [collectionSlug]: <titleFieldKey> } so we can generate a pretty error message later
    const relatedDraftCollections: Record<string, string> = {}

    relationsTo.forEach((name) => {
      const collection = config.collections.find(({ slug }) => slug === name)
      if (collection?.versions?.drafts) {
        relatedDraftCollections[collection.slug] = collection.admin.useAsTitle
      }
    })

    // compile an array of related draft documents to check
    const relatedDocs = await values.reduce<Promise<Array<MaybeScheduledDoc & { collection: string }>>>(async (accPromise, v) => {
      const acc = await accPromise;
    
      // naively assume that we're dealing with a simple (not polymorphic) relationship
      // https://payloadcms.com/docs/fields/relationship#how-the-data-is-saved
      let collection = props.relationTo as string;
      let id = v as string | number
    
      // handle polymorphic relationships
      if (typeof v === 'object') {
        collection = v.relationTo
        id = v.value
      }
    
      // ignore related docs w/o drafts
      if (!relatedDraftCollections[collection]) {
        return acc
      }

      try {
        const doc = await payload.findByID({
          id,
          collection,
          req,
        });
      
        // Only add the document if it's in draft status
        if (doc && doc._status === 'draft') {
          acc.push({ ...doc, collection })
        }
      } catch (error: unknown) {
        payload.logger.error(error, `[SafeRelationship] ${collection}:${id}`)
      }
    
      return acc;
    }, Promise.resolve([]))

    const invalidRelatedDocs: Array<{ collection: string; title: string }> = []

    // store a reference to the publish date for the current document
    let publishDate: Date
    if (data?._status === 'published' || !data?._status) {
      // for published docs, or docs w/o drafts, we assume they are currently being published
      publishDate = new Date()
    } else if (data?._status === 'draft' && data?.publish_date) {
      // for scheduled documents, use the set publish_date
      publishDate = new Date(data.publish_date)
    }

    // loop over the related documents and find any stragglers
    relatedDocs
      .forEach((rd) => {
        const docPubDate = rd.publish_date
          ? new Date(rd.publish_date)
          : null // this check is necessary otherwise new Date(null) => 1/1/70
        if (!docPubDate || docPubDate >= publishDate) {
          invalidRelatedDocs.push({
            collection: rd.collection,
            title: rd[relatedDraftCollections[rd.collection]] as string
          })
        }
      })

    if (invalidRelatedDocs.length > 0) {
      return `The following docs must be published before this one: ${invalidRelatedDocs.map(({ collection, title }) => `${title} (${collection})`).join(', ')}`
    }

    return true
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    type: 'relationship',
    ...props,
    validate
  } as RelationshipField
}
