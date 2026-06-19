import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { buildConfig } from 'payload'

import { baseConfig } from './payload.base.config.js'

let memoryDB: MongoMemoryReplSet | undefined

const buildConfigWithMemoryDB = async () => {
  // Use DATABASE_URI from dev/.env when set (same as pnpm dev). In-memory repl set is a
  // fallback for CI/local runs without Mongo; count: 1 is enough for Payload drafts/transactions.
  if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URI) {
    memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }

  const isTest = process.env.NODE_ENV === 'test'

  return buildConfig({
    ...baseConfig,
    db: mongooseAdapter({
      ...(isTest
        ? {
            connectOptions: {
              autoCreate: true,
            },
            ensureIndexes: true,
            ...(memoryDB ? { mongoMemoryServer: memoryDB } : {}),
          }
        : {}),
      url: process.env.DATABASE_URI || '',
    }),
  })
}

export default buildConfigWithMemoryDB()
