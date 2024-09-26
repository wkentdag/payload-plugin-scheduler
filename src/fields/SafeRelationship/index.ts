import type { Payload } from 'payload'
import type { SanitizedConfig } from 'payload/config'
import type {
  RelationshipField,
  RelationshipValue,
  Validate,
} from 'payload/types'

const SafeRelationshipField: (
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
    }: { config: SanitizedConfig; data: object; payload: Payload } = options

    // can't run on the client
    if (!payload) {
      return true
    }

    // abort if the current document is a draft
    if (data?._status === 'draft' && !data?.publish_date) {
      return true
    }

    // cast relationTo to an array
    const relationsTo = Array.isArray(props.relationTo)
      ? props.relationTo
      : [props.relationTo]

    // build a list of collections we need to check draft status for
    const relatedDraftCollections = []

    relationsTo.forEach((name) => {
      const collection = config.collections.find(({ slug }) => slug === name)
      if (!!collection?.versions?.drafts) {
        relatedDraftCollections.push(collection.slug)
      }
    })

    // cast value to an array
    const values = Array.isArray(value) ? value : [value]

    // compile an array of related documents
    const relatedDocs = await Promise.all(
      values.map(async (v) => {
        // naively assume that we're dealing with a simple (not polymorphic) relationship
        // https://payloadcms.com/docs/fields/relationship#how-the-data-is-saved
        let collection = props.relationTo as string
        let id = v as string | number

        // handle polymorphic relationships
        if (typeof v === 'object') {
          collection = v.relationTo
          id = v.value
        }

        // ignore related docs w/o drafts
        if (!relatedDraftCollections.includes(collection)) {
          return null
        }

        const doc = await payload.findByID({
          id,
          collection,
        })

        return doc
      }),
    )

    const invalidRelatedDocs = []

    const publishDate =
      data?._status === 'published' ? new Date() : new Date(data?.publish_date)

    // loop over the related documents...
    relatedDocs
      // filter out invalid elements @TODO perform this step above in a `reduce`
      .filter((doc) => {
        return !!doc && doc?._status === 'draft'
      })
      // find any invalid publish_dates
      .forEach((data) => {
        const docPubDate = data.publish_date
          ? new Date(data.publish_date)
          : null
        // console.log(docPubDate, publishDate, docPubDate >= publishDate)
        if (!docPubDate || docPubDate >= publishDate) {
          invalidRelatedDocs.push(data.id)
        }
      })

    if (invalidRelatedDocs.length > 0) {
      return `The following documents won't be published before this one: ${invalidRelatedDocs.join(', ')}. Please remove the publish_date from the current document, or change the publish_date on the related documents`
    }

    return true
  }

  const field: RelationshipField = {
    type: 'relationship',
    ...props,
    validate,
  } as RelationshipField

  return field
}

export default SafeRelationshipField
