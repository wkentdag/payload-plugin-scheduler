import dotenv from 'dotenv'
import { resolve } from 'path'

import { start } from '../src/server'
import { createClient } from '../../src'

module.exports = async function () {
  dotenv.config({
    path: resolve(__dirname, '../.env'),
  })

  // https://payloadcms.com/docs/local-api/overview#nextjs-conflict-with-local-api
  const payload = await start({ local: true })
  globalThis.payloadClient = payload

  const algolia = createClient({
    appId: process.env.ALGOLIA_APPLICATION_ID!,
    apiKey: process.env.ALGOLIA_ADMIN_API_KEY!,
    index: process.env.ALGOLIA_INDEX!,
  })
  globalThis.algoliaClient = algolia
}
