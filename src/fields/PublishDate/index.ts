import type { DateField } from 'payload'

import { defaultOpts, normalizeScheduleConfig } from '../../config.js'
import {
  publishDateFieldCustomKey,
  publishDateFieldOverridesCustomKey,
} from '../../lib.js'
import type {
  ManualPublishDateFieldOptions,
  NormalizedScheduledPostConfig,
  ScheduledPostConfig,
} from '../../types.js'

const PublishDateField = (
  scheduleConfig: NormalizedScheduledPostConfig | ScheduledPostConfig,
): DateField => {
  return normalizeScheduleConfig(scheduleConfig).publishDate
}

export const publishDate = (options: ManualPublishDateFieldOptions = {}): DateField => {
  // This helper cannot access the plugin's normalized config yet. It returns a
  // marked field that preserves placement and carries manual display overrides
  // for the plugin to resolve later.
  return {
    ...defaultOpts.publishDate,
    custom: {
      [publishDateFieldCustomKey]: true,
      [publishDateFieldOverridesCustomKey]: options,
    },
  }
}

export default PublishDateField
