import type { DateField } from 'payload'

import { normalizeScheduleConfig } from '../../config.js'
import type {
  NormalizedScheduledPostConfig,
  PublishDateFieldOptions,
  ScheduledPostConfig,
} from '../../types.js'

const PublishDateField = (
  scheduleConfig: NormalizedScheduledPostConfig | ScheduledPostConfig,
): DateField => {
  return normalizeScheduleConfig(scheduleConfig).publishDate
}

export const publishDate = (options: PublishDateFieldOptions = {}): DateField => {
  return PublishDateField({
    publishDate: options,
  })
}

export default PublishDateField
