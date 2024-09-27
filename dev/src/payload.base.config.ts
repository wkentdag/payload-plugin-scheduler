import type { Plugin, Config } from "payload/config";
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'

import path from 'path'
import Users from './collections/Users'
import Pages from './collections/Pages'
import Posts from './collections/Posts'
import PagesWithExtraHooks from "./collections/PagesWithExtraHooks";

// @ts-expect-error
import { ScheduledPostPlugin } from '../../src'
import Home from "./globals/Home";
import Basics from "./collections/Basics";

export const INTERVAL = 1

export const baseConfig: Omit<Config, 'db'> = {
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
  collections: [Basics, Pages, PagesWithExtraHooks, Posts, Users],
  globals: [Home],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    (ScheduledPostPlugin({
      collections: ['pages', 'posts', 'pageswithextrahooks'],
      globals: ['home'],
      interval: INTERVAL,
      scheduledPosts: {
        admin: {
          hidden: false,
        },
      },
    }) as unknown as Plugin),
  ],
}