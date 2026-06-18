import type { SafeRelationship } from './fields/SafeRelationship/index.js'

export interface ValueWithRelation {
  relationTo: string
  value: number | string
}

export interface ScheduledPostConfig {
  collections?: string[]
  globals?: string[]
  interval?: number
}

export type SafeRelationshipField = typeof SafeRelationship
