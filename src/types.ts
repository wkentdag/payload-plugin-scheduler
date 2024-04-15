import { type AlgoliaSearchOptions } from 'algoliasearch'
import { type CollectionAfterChangeHook } from 'payload/types'

export interface SearchAttributes extends UnknownSearchAttributes {
  objectID?: never
}

export interface UnknownSearchAttributes {
  [key: string]: any
}

export type GenerateSearchAttributes<D extends SearchAttributes = UnknownSearchAttributes> = (
  args: Parameters<CollectionAfterChangeHook>[0],
) => D | Promise<D> | undefined

export interface AlgoliaSearchConfig<D extends SearchAttributes = UnknownSearchAttributes> {
  algolia: {
    appId: string
    apiKey: string
    index: string
    options?: AlgoliaSearchOptions
  }
  waitForHook?: boolean
  collections?: string[]
  generateSearchAttributes?: GenerateSearchAttributes<D>
}
