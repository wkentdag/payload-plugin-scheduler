import { buildConfig } from 'payload/config';
import path from 'path';
import Users from './collections/Users';
import Examples from './collections/Examples';
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { AlgoliaSearchPlugin } from '../../src'
import VersionedExamples from './collections/VersionedExamples'

export interface SearchRecord {
  title: string
  text: string
  collection: string
  custom: 'attribute'
}

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
  collections: [Examples, VersionedExamples, Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    AlgoliaSearchPlugin({
      algolia: {
        appId: process.env.ALGOLIA_APPLICATION_ID,
        apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
        index: process.env.ALGOLIA_INDEX,
      },
      collections: ['examples', 'versioned_examples'],
      waitForHook: true,
      generateSearchAttributes: ({ doc: { title, text }, collection }): SearchRecord => {
        return {
          title,
          text,
          collection: collection.slug,
          custom: 'attribute',
        }
      },
    }),
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})
