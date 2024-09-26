import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types'
import type { Pageswithextrahook } from 'payload/generated-types'
// @ts-expect-error
import { debug } from '../../../src/util'

export const ExtraHook: CollectionAfterChangeHook<Pageswithextrahook> = async ({ doc, req }) => {
  debug(`afterChange ${doc?.id}`)

  if (doc?._status === 'published') { // eslint-disable-line no-underscore-dangle
    if (req.transactionID && doc?.title === 'commit-and-throw') {
      await req.payload.db.commitTransaction(req.transactionID)
    }

    if (doc?.title.includes('throw')) {
      throw new Error('test hook failure')
    }
  }

  return doc
}

const PagesWithExtraHooks: CollectionConfig = {
  slug: 'pageswithextrahooks',
  admin: {
    useAsTitle: 'title',
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      ExtraHook
    ]
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ]
}

export default PagesWithExtraHooks
