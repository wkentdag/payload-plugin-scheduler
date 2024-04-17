import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { postgresAdapter } from '@payloadcms/db-postgres'

import {  buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import Pages from './collections/Pages'
// @ts-expect-error
import { ScheduledPostPlugin } from '../../src'
import Posts from './collections/Posts'

export const INTERVAL = 1

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config?.resolve?.alias || {}),
            react: path.join(__dirname, '../node_modules/react'),
            'react-dom': path.join(__dirname, '../node_modules/react-dom'),
            payload: path.join(__dirname, '../node_modules/payload'),
          },
        },
      }
      return newConfig
    },
  },
  editor: slateEditor({}),
  collections: [Pages, Posts, Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    ScheduledPostPlugin({
      collections: ['pages', 'posts'],
      interval: INTERVAL,
      scheduledPosts: {
        admin: {
          hidden: false,
        },
      },
    }),
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI_PG,
    },
  }),
})
