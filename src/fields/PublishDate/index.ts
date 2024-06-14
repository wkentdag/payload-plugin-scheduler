import type { DateField } from 'payload/types'
import type { ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types'
import InputField from './components/InputField'
import type { ScheduledPostConfig } from '../../types'
import Cell from './components/Cell'

const PublishDateField = (scheduleConfig: ScheduledPostConfig): DateField => {
  const datePickerProps: ConditionalDateProps = {
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
        Field: InputField(datePickerProps),
        Cell,
      },
    },
  }
}

export default PublishDateField
