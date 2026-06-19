import type { DateField } from 'payload'

import type { SafeRelationship } from './fields/SafeRelationship/index.js'

export interface ValueWithRelation {
  relationTo: string
  value: number | string
}

type DateFieldAdmin = NonNullable<DateField['admin']>
type DateFieldAdminComponents = NonNullable<DateFieldAdmin['components']>
type DateFieldAdminDate = NonNullable<DateFieldAdmin['date']>
export type ReservedPublishDateComponentSlots = 'afterInput' | 'Cell'
type ReservedPublishDateDateProps = 'pickerAppearance' | 'timeIntervals'

export type PublishDateFieldOptions = Partial<Omit<DateField, 'admin' | 'type'>> & {
  admin?: Partial<Omit<DateFieldAdmin, 'components' | 'date'>> & {
    components?: Partial<Omit<DateFieldAdminComponents, ReservedPublishDateComponentSlots>>
    date?: Partial<Omit<DateFieldAdminDate, ReservedPublishDateDateProps>>
  }
}

export interface ScheduledPostConfig {
  collections?: string[]
  globals?: string[]
  interval?: number
  publishDate?: PublishDateFieldOptions
}

export type NormalizedScheduledPostConfig = {
  collections: string[]
  globals: string[]
  interval: number
  publishDate: DateField
}

export type SafeRelationshipField = typeof SafeRelationship
