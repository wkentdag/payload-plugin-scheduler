import { CollectionAfterDeleteHook } from 'payload/types'

import createClient from '../algolia'
import { AlgoliaSearchConfig } from '../types'
import { getObjectID } from './syncWithSearch'

export default function deleteFromSearch(
  searchConfig: AlgoliaSearchConfig,
): CollectionAfterDeleteHook {
  return async ({ doc, collection, req: { payload } }) => {
    try {
      const searchClient = createClient(searchConfig.algolia)
      const objectID = getObjectID({ collection, doc })

      searchClient.deleteObject(objectID)
    } catch (error) {
      payload.logger.error({
        err: `Error deleting search for ${collection.slug} ${doc.id}: ${error}`,
      })
    }
  }
}
