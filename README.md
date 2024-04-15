# payload-plugin-algolia

PayloadCMS plugin that syncs collections with Algolia search

![ci status](https://github.com/wkentdag/payload-plugin-algolia/actions/workflows/test.yml/badge.svg)

## Installation

```sh
npm i payload-plugin-algolia
```

## Usage

At a minimum, the plugin requires Algolia credentials and a list of enabled collections.

```ts
// payload.config.ts

import { buildConfig } from 'payload/config'
import { AlgoliaSearchPlugin } from 'payload-plugin-algolia'
import Pages from './collections/Pages'
import Posts from './collections/Posts'

export default buildConfig({
  collections: [Pages, Posts],
  plugins: [
    AlgoliaSearchPlugin({
      algolia: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
        index: process.env.ALGOLIA_INDEX
      },
      collections: ['pages', 'posts']
    })
  ]
  // ...more config
})

```

## Options

### `generateSearchAttributes`

By default, the plugin will pass the entire document through to Algolia, with two appended keys:

* `objectID`: format `${collection}:${id}` eg `pages:1`
* `collection`: the collection slug

You can modify search attributes by providing a custom `generateSearchAttributes` function:

```ts
import { type GenerateSearchAttributes } from 'plugin-payload-algolia'

interface PageRecord {
  title: string
  text: string
}

interface PostRecord extends PageRecord {
  image: string
}

const generateSearchAttributes: GenerateSearchAtributes<
  PageRecord | PostRecord
> = async ({ doc, collection, req: { payload } }) => {
  switch (collection.slug) {
    case 'posts': {
      if (doc.featured_image) {
        const { url } = await payload.findById({
          collection: 'media',
          id: doc.featured_image as number
        })

        return {
          ...doc,
          image: url,
        }
      }

      return doc
    }
    default:
      return doc
  }
} 
```

### `waitForHook`

> `Boolean`, default = `false`

Set to `true` to wait for algolia set / delete operations during the collection hooks.

## Notes

> The current scope of the plugin is quite limited. PRs welcome!

### Drafts
Drafts are not indexed. If a document is unpublished, it gets removed from search results. Otherwise, draft updates to a published document have no effect.

### Globals

Globals are not supported for indexing.

### Algolia search config

The internal Algolia client accepts [all options](https://github.com/algolia/algoliasearch-client-javascript/blob/master/packages/algoliasearch/src/types/AlgoliaSearchOptions.ts). Beyond that, the rest of the setup for a typical Algolia configuration is outside the scope of the plugin (setting search attributes and facets, etc).
