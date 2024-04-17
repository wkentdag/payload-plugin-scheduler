import express from 'express'
import payload, { type Payload } from 'payload'
import { type InitOptions } from 'payload/config'

const PORT = process.env.PORT || 3000

// eslint-disable-next-line
require('dotenv').config()
const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

export const start = async (args?: Partial<InitOptions>): Promise<void|Payload> => {
  // Initialize Payload
  const client = await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    // onInit: async _payload => {
    //   _payload.logger.info(`Payload Admin URL: ${_payload.getAdminURL()}`)
    // },
    ...(args || {}),
  })

  if (!(args?.local === true)) {
    app.listen(PORT)
    payload.logger.info(`Payload listening on port ${PORT}`)
    return null
  }

  // nb in jest, this is added to the global namespace
  // https://payloadcms.com/docs/local-api/overview#nextjs-conflict-with-local-api
  return client
}

start()
