import type { DateField } from 'payload'

import { publishDateFieldCustomKey } from '../../lib.js'
import type { PublishDateFieldOptions, ScheduledPostConfig } from '../../types.js'
import { getPublishDateFieldName } from '../../util.js'

type DatePickerProps = NonNullable<NonNullable<DateField['admin']>['date']>
type PublishDateFieldConfig = ScheduledPostConfig & {
  timezone?: boolean
}

const PublishDateField = (scheduleConfig: PublishDateFieldConfig): DateField => {
  const datePickerProps: DatePickerProps = {
    pickerAppearance: 'dayAndTime',
    timeIntervals: scheduleConfig.interval,
  }

  return {
    name: getPublishDateFieldName(scheduleConfig),
    label: scheduleConfig.publishDate?.label || 'Publish Date',
    index: true,
    type: 'date',
    ...(scheduleConfig.timezone ? { timezone: true } : {}),
    admin: {
      date: datePickerProps,
      position: scheduleConfig.publishDate?.admin?.position || 'sidebar',
      components: {
        afterInput: ['payload-plugin-scheduler/rsc#PublishDateAfterInputServer'],
        Cell: 'payload-plugin-scheduler/client#PublishDateCell',
      },
    },
    custom: {
      [publishDateFieldCustomKey]: true,
    },
  }
}

export const publishDate = (options: PublishDateFieldOptions = {}): DateField => {
  return PublishDateField({
    interval: 5,
    publishDate: options,
  })
}

export default PublishDateField
