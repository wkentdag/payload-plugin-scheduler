import type { Config } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { ScheduledPostPlugin } from '../../src/index.js'
import Basics from './collections/Basics'
import Pages from './collections/Pages'
import PagesWithExtraHooks from './collections/PagesWithExtraHooks'
import Posts from './collections/Posts'
import Users from './collections/Users'
import Home from './globals/Home'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const INTERVAL = 1

export const baseConfig: Omit<Config, 'db'> = {
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, '..'),
      importMapFile: path.resolve(dirname, '../app/(payload)/admin/importMap.js'),
    },
    user: Users.slug,
  },
  editor: lexicalEditor(),
  collections: [Basics, Pages, PagesWithExtraHooks, Posts, Users],
  globals: [Home],
  secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  plugins: [
    ScheduledPostPlugin({
      collections: ['pages', 'posts', 'pageswithextrahooks'],
      globals: ['home'],
      interval: INTERVAL,
      scheduledPosts: {
        admin: {
          hidden: false,
        },
      },
    }),
  ],
}
