import { afterAll } from 'vitest'
import { getPayload, type Payload } from 'payload'

declare global {
  // eslint-disable-next-line no-var
  var payloadClient: Payload | undefined
}

const loadConfig = async () => {
  if (process.env.PAYLOAD_CONFIG_PATH?.includes('mongo')) {
    const { default: config } = await import('../src/payload.mongo.config')
    return config
  }

  const { default: config } = await import('../src/payload.postgres.config')
  return config
}

const config = await loadConfig()
globalThis.payloadClient = await getPayload({ config })

afterAll(async () => {
  const payload = globalThis.payloadClient
  if (!payload) {return}

  if (process.env.PAYLOAD_CONFIG_PATH?.includes('mongo')) {
    await payload.db.destroy()
    return
  }

  await payload.db.destroy()
})
