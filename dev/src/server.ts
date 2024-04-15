import express from 'express'
import payload from 'payload'
import { InitOptions } from 'payload/config'

require('dotenv').config()
const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

export const start = async (args?: Partial<InitOptions>) => {
  // Initialize Payload
  const client = await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
    ...(args || {}),
  })

  if (!args?.local === true) {
    app.listen(3000)
    payload.logger.info(`Payload listening on port ${3000}`)
  } else {
    // nb in jest, this is added to the global namespace
    // https://payloadcms.com/docs/local-api/overview#nextjs-conflict-with-local-api
    return client
  }
}

start()
