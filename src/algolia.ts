import algoliasearch from 'algoliasearch'

import { AlgoliaSearchConfig } from './types'

export default function createClient({ appId, apiKey, options, index }: AlgoliaSearchConfig['algolia']) {
  if (!appId || !apiKey || !index) {
    throw new Error(`[payload-plugin-algolia] missing required Algolia creds`)
  }
  const client = algoliasearch(appId, apiKey, options)
  const searchIndex = client.initIndex(index)
  return searchIndex
}
