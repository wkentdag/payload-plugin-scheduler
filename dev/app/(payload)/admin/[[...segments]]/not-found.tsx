import type { Metadata } from 'next'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import configPromise from '@payload-config'

import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

const defaultParams = Promise.resolve({ segments: [] })
const defaultSearchParams = Promise.resolve({})

export const generateMetadata = async ({
  params = defaultParams,
  searchParams = defaultSearchParams,
}: Partial<Args> = {}): Promise<Metadata> =>
  generatePageMetadata({ config: configPromise, params, searchParams })

const NotFound = async ({ params = defaultParams, searchParams = defaultSearchParams }: Partial<Args>) =>
  NotFoundPage({ config: configPromise, importMap, params, searchParams })

export default NotFound
