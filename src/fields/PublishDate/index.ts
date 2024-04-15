import { DateField } from 'payload/types'
import InputField from './InputField'
import { ScheduledPostConfig } from '../../types'
import { ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types'

const PublishDateField = (scheduleConfig: ScheduledPostConfig): DateField => {
  const datePickerProps: ConditionalDateProps = {
    pickerAppearance: 'dayAndTime',
    timeIntervals: scheduleConfig.interval,
  }

  return {
    name: 'publish_date',
    label: 'Publish At',
    type: 'date',
    admin: {
      date: datePickerProps,
      position: 'sidebar',
      components: {
        Field: InputField(datePickerProps),
      },
    },
  }
}

export default PublishDateField
