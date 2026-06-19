import type {
  RelationshipField,
  RelationshipFieldValidation,
  TypeWithID,
} from 'payload'

import { getPublishDateFieldNameFromFields } from '../../util.js'

type MaybeScheduledDoc = TypeWithID & Record<string, unknown> & {
  _status?: 'published' | 'draft'

}

/**
 * Wrapper around the default `RelationshipField` that ensures "related" documents are published before the primary document
 */
export const SafeRelationship: (
  props: Omit<RelationshipField, 'type'>,
) => RelationshipField = (props) => {
  const validate: RelationshipFieldValidation = async (
    value,
    options,
  ): Promise<string | true> => {
    // first run user validate fn
    if (props.validate) {
      const validateRes = await (props.validate as RelationshipFieldValidation)(value, options)
      if (validateRes !== true) {
        return validateRes
      }
    }

    const { data: rawData, req } = options
    const data = rawData as MaybeScheduledDoc
    const payload = req.payload
    const { config } = payload
    const currentCollection = options.collectionSlug
      ? config.collections.find((collection) => collection.slug === options.collectionSlug)
      : undefined
    const currentPublishDateFieldName = currentCollection
      ? getPublishDateFieldNameFromFields(currentCollection.fields)
      : getPublishDateFieldNameFromFields([])

    // abort if the field is empty
    if (!value || Array.isArray(value) && value.length === 0) {
      return true
    }

    // abort if the current document is an unscheduled draft
    if (data?._status === 'draft' && !data?.[currentPublishDateFieldName]) {
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
    const relatedDraftCollections: Record<string, { publishDateFieldName: string; titleFieldName: string }> = {}

    relationsTo.forEach((name) => {
      const collection = config.collections.find((collection) => collection.slug === name)
      const useAsTitle = collection?.admin.useAsTitle
      if (collection?.versions?.drafts && useAsTitle) {
        relatedDraftCollections[collection.slug] = {
          publishDateFieldName: getPublishDateFieldNameFromFields(collection.fields),
          titleFieldName: useAsTitle,
        }
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
          collection: collection as never,
          req,
        }) as MaybeScheduledDoc
      
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
    } else if (data?._status === 'draft' && data?.[currentPublishDateFieldName]) {
      // for scheduled documents, use the set publish_date
      publishDate = new Date(data[currentPublishDateFieldName] as string)
    }

    // loop over the related documents and find any stragglers
    relatedDocs
      .forEach((rd) => {
        const relatedCollection = relatedDraftCollections[rd.collection]
        const docPubDate = rd[relatedCollection.publishDateFieldName]
          ? new Date(rd[relatedCollection.publishDateFieldName] as string)
          : null // this check is necessary otherwise new Date(null) => 1/1/70
        if (!docPubDate || docPubDate >= publishDate) {
          invalidRelatedDocs.push({
            collection: rd.collection,
            title: rd[relatedCollection.titleFieldName] as string
          })
        }
      })

    if (invalidRelatedDocs.length > 0) {
      return `The following docs must be published before this one: ${invalidRelatedDocs.map(({ collection, title }) => `${title} (${collection})`).join(', ')}`
    }

    return true
  }

   
  return {
    type: 'relationship',
    ...props,
    validate
  } as RelationshipField
}
