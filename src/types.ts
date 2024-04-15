import { ValueWithRelation } from 'payload/types'

export interface ScheduledPostConfig {
  collections: string[]
  interval?: number
}

export type ScheduledPost = {
  id: string | number
  post: ValueWithRelation
  date: string
  status: 'queued' | 'complete'
}
