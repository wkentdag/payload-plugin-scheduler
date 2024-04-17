import type { CollectionConfig } from 'payload/types'
import { merge } from 'ts-deepmerge'
import type { ScheduledPostConfig } from '../types'

const ScheduledPosts = (scheduleConfig: ScheduledPostConfig): CollectionConfig =>
  merge(
    {
      slug: 'scheduled_posts',
      labels: {
        plural: 'Scheduled Posts',
        singular: 'Scheduled Post',
      },
      access: {
        create: () => false,
        read: () => true,
      },
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'post',
          type: 'relationship',
          unique: true,
          required: true,
          relationTo: [...scheduleConfig.collections],
          hasMany: false,
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
              timeIntervals: scheduleConfig.interval,
            },
            readOnly: true,
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
          admin: {
            readOnly: true,
          },
        },
      ].filter(Boolean),
    },
    scheduleConfig?.scheduledPosts || {},
  ) as CollectionConfig

export default ScheduledPosts
