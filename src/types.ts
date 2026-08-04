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

export type PublishDateFieldOptions = Partial<Omit<DateField, 'admin' | 'timezone' | 'type'>> & {
  admin?: Partial<Omit<DateFieldAdmin, 'components' | 'date'>> & {
    components?: Partial<Omit<DateFieldAdminComponents, ReservedPublishDateComponentSlots>>
    date?: Partial<Omit<DateFieldAdminDate, ReservedPublishDateDateProps>>
  }
}

export type ManualPublishDateFieldOptions = Omit<PublishDateFieldOptions, 'name'>

/**
 * Controls whose access permissions Payload uses when the scheduled publish job executes.
 * Use `override` to execute the job with `overrideAccess` set to `true`.
 */
export type ExecutionAccess = 'override' | 'user'

export interface ScheduledPostConfig {
  collections?: string[]
  executionAccess?: ExecutionAccess
  globals?: string[]
  interval?: number
  publishDate?: PublishDateFieldOptions
}

export type NormalizedScheduledPostConfig = {
  collections: string[]
  executionAccess: ExecutionAccess
  globals: string[]
  interval: number
  publishDate: DateField
}

export type SafeRelationshipField = typeof SafeRelationship
