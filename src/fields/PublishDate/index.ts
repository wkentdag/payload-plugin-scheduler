import type { DateField } from 'payload'

import type { ScheduledPostConfig } from '../../types.js'

type DatePickerProps = NonNullable<NonNullable<DateField['admin']>['date']>

const PublishDateField = (scheduleConfig: ScheduledPostConfig): DateField => {
  const datePickerProps: DatePickerProps = {
    pickerAppearance: 'dayAndTime',
    timeIntervals: scheduleConfig.interval,
  }

  return {
    name: 'publish_date',
    label: 'Publish Date',
    index: true,
    type: 'date',
    admin: {
      date: datePickerProps,
      position: 'sidebar',
      components: {
        afterInput: ['payload-plugin-scheduler/rsc#PublishDateInputField'],
        Cell: 'payload-plugin-scheduler/client#PublishDateCell',
      },
    },
  }
}

export default PublishDateField
