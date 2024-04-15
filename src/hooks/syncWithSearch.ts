import { CollectionAfterChangeHook } from 'payload/types'

import createClient from '../algolia'
import { AlgoliaSearchConfig } from '../types'

const generateSearchAttributes: AlgoliaSearchConfig['generateSearchAttributes'] = ({
  collection,
  doc,
}) => {
  return {
    collection: collection.slug,
    ...doc,
  }
}

export const getObjectID = ({
  collection,
  doc,
}: Pick<Parameters<CollectionAfterChangeHook>[0], 'collection' | 'doc'>) =>
  `${collection.slug}:${doc.id}`

export default function syncWithSearch(
  searchConfig: AlgoliaSearchConfig,
): CollectionAfterChangeHook {
  return async (args: Parameters<CollectionAfterChangeHook>[0]) => {
    const {
      collection,
      doc,
      req: { payload },
      previousDoc,
    } = args
    try {
      if (doc?._status === 'draft' && !previousDoc) {
        // quick early exit for first drafts
        return doc
      }

      const searchClient = createClient(searchConfig.algolia)
      const objectID = getObjectID({ collection, doc })

      // remove search results for unpublished docs
      if (doc?._status === 'draft' && previousDoc) {
        // distinguish between "pending change" (canonical document is still published)
        // vs "unpublish" (canonical document is draft)
        try {
          const publishedDoc = await payload.findByID({
            collection: collection.slug,
            id: doc.id,
            draft: false,
          })

          if (publishedDoc && publishedDoc._status === 'published') {
            // ignore pending changes
            return doc
          } else {
            // remove search results for unpublished
            const deleteOp = searchClient.deleteObject(objectID)

            if (searchConfig.waitForHook === true) {
              await deleteOp.wait()
            }

            return doc
          }
        } catch (error) {
          return doc
        }
      }

      const generateSearchAttributesFn =
        searchConfig.generateSearchAttributes || generateSearchAttributes

      const searchDoc = await generateSearchAttributesFn!(args)

      if (!searchDoc) {
        // @TODO check for stale search results?
        return doc
        // throw new Error('invalid searchDoc')
      }

      const saveOp = searchClient.saveObject({
        objectID,
        collection: collection.slug,
        ...searchDoc,
      })

      if (searchConfig.waitForHook === true) {
        await saveOp.wait()
      }
    } catch (error) {
      payload.logger.error({
        err: `Error syncing search for ${collection.slug} ${doc.id}: ${error}`,
      })
    }

    return doc
  }
}
