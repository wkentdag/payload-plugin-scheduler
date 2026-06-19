import type { DateField, FieldPosition } from 'payload'

import type { SafeRelationship } from './fields/SafeRelationship/index.js'

export interface ValueWithRelation {
  relationTo: string
  value: number | string
}

export type PublishDateFieldOptions = {
  admin?: {
    position?: FieldPosition
  }
  label?: DateField['label']
  name?: string
}

export interface ScheduledPostConfig {
  collections?: string[]
  globals?: string[]
  interval?: number
  publishDate?: PublishDateFieldOptions
}

export type SafeRelationshipField = typeof SafeRelationship
