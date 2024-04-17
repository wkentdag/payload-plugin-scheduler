import dotenv from 'dotenv'
import { resolve } from 'path'

import { start } from '../src/server'

module.exports = async function () {
  dotenv.config({
    path: resolve(__dirname, '../.env'),
  })

  // https://payloadcms.com/docs/local-api/overview#nextjs-conflict-with-local-api
  // const opts: Partial<InitOptions> = { local: true }
  // if (process.env.DB === 'mongo') {
  //   opts.config = mongoConfig
  // }
  const payload = await start({ local: true })
  globalThis.payloadClient = payload
}
