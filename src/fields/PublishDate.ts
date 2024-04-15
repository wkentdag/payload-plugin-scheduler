import { DateField } from 'payload/types'

const PublishDateField = (interval: number): DateField => {
  return {
    name: 'publish_date',
    label: 'Publish At',
    type: 'date',
    admin: {
      date: {
        pickerAppearance: 'dayAndTime',
        timeIntervals: interval,
      },
      position: 'sidebar',
    },
  }
}

export default PublishDateField
