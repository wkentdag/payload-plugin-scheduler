import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import type { Pageswithextrahook } from 'payload/generated-types'
import Pages from './Pages'
import { debug } from '../../../src/util'

export const ExtraHook: CollectionAfterChangeHook<Pageswithextrahook> = async ({ doc, req }) => {
  debug(`afterChange ${doc?.id}`)

  if (doc?._status === 'published') {  
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
  ...Pages,
  slug: 'pageswithextrahooks',
  hooks: {
    afterChange: [
      ExtraHook
    ]
  }
}

export default PagesWithExtraHooks
