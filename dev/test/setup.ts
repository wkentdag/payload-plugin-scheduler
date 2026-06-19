import { getPayload, type Payload } from 'payload'

declare global {
  // eslint-disable-next-line no-var
  var payloadClient: Payload | undefined
}

const isMongo = process.env.PAYLOAD_CONFIG_PATH?.includes('mongo')

const loadConfig = async () => {
  if (isMongo) {
    // dev/.env often points DATABASE_URI at postgres; ignore it for mongo tests.
    if (process.env.DATABASE_URI && !process.env.DATABASE_URI.startsWith('mongodb')) {
      delete process.env.DATABASE_URI
    }

    const { default: config } = await import('../src/payload.mongo.config.js')
    return await config
  }

  const { default: config } = await import('../src/payload.postgres.config.js')
  return config
}

if (!globalThis.payloadClient) {
  globalThis.payloadClient = await getPayload({ config: await loadConfig() })
}
