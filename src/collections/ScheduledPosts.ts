import { CollectionConfig } from 'payload/types'
import { ScheduledPostConfig } from '../types'

const ScheduledPosts = ({ collections, interval = 15 }: ScheduledPostConfig): CollectionConfig => {
  return {
    slug: 'scheduled_posts',
    labels: {
      plural: 'Scheduled Posts',
      singular: 'Scheduled Post',
    },
    access: {
      create: () => false,
      update: () => false,
      read: () => true,
    },
    // admin: {
    //   hidden: true,
    // },
    fields: [
      {
        name: 'post',
        type: 'relationship',
        unique: true,
        index: true,
        relationTo: collections,
        admin: {
          readOnly: true,
        },
      },
      {
        name: 'date',
        type: 'date',
        admin: {
          date: {
            pickerAppearance: 'dayAndTime',
            timeIntervals: interval,
          },
        },
      },
      {
        name: 'status',
        type: 'select',
        options: [
          {
            value: 'queued',
            label: 'Queued',
          },
          {
            value: 'complete',
            label: 'Complete',
          },
        ],
      },
    ],
  }
}

export default ScheduledPosts
