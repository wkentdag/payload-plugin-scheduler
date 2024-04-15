import { CollectionConfig, ValueWithRelation } from 'payload/types'

export interface ScheduledPostConfig {
  collections: string[]
  interval?: number
  scheduledPosts?: Partial<Omit<CollectionConfig, 'slug'>>
}

export type ScheduledPost = {
  id: string | number
  post: ValueWithRelation
  date: string
  status: 'queued' | 'complete'
}
