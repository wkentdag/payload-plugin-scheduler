import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'

import { baseConfig } from './payload.base.config'

export default buildConfig({
  ...baseConfig,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
    transactionOptions: {
      maxTimeMS: 10000,
      maxCommitTimeMS: 10000,
    },
  }),
})
