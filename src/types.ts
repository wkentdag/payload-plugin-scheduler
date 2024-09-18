import type { CollectionConfig, ValueWithRelation } from 'payload/types'

export interface ScheduledPostConfig {
  collections?: string[]
  globals?: string[]
  interval?: number
  scheduledPosts?: Partial<Omit<CollectionConfig, 'slug'>>
}

export interface ScheduledPost {
  id: string | number
  post: ValueWithRelation
  date: string
  status: 'queued' | 'complete'
}
