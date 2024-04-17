import { postgresAdapter } from '@payloadcms/db-postgres'
import {  buildConfig } from 'payload/config'
import { baseConfig } from './payload.base.config'

export default buildConfig({
  ...baseConfig,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
})
