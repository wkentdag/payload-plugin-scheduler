import { Config, buildConfig } from 'payload/config'
import { baseConfig } from './payload.config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

const config: Config = {
  ...baseConfig,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
    transactionOptions: {
      maxTimeMS: 10000,
      maxCommitTimeMS: 10000,
    },
  }),
}

export default buildConfig(baseConfig)
