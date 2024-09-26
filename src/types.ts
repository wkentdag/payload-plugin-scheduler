import type { CollectionConfig, ValueWithRelation } from 'payload/types'
import type SafeRelationship from './fields/SafeRelationship'

export interface ScheduledPostConfig {
  collections?: string[]
  globals?: string[]
  interval?: number
  scheduledPosts?: Partial<Omit<CollectionConfig, 'slug'>>
}

export interface ScheduledPost {
  id: string | number
  post?: ValueWithRelation
  global?: string
  date: string
  status: 'queued' | 'complete'
}

export type SafeRelationshipField = typeof SafeRelationship