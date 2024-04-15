import { CollectionBeforeChangeHook } from 'payload/types'
import { ScheduledPostConfig } from '../types'

import { debug } from '../util'

export default function syncSchedule(
  scheduleConfig: ScheduledPostConfig,
): CollectionBeforeChangeHook {
  return async ({ collection, data, originalDoc, req: { payload } }) => {
    const isPublishing = data._status === 'published'
    const shouldSchedule = data.publish_date && new Date(data.publish_date) > new Date()
    const scheduleChanged = data.publish_date !== originalDoc?.publish_date
    debug(collection?.slug, originalDoc?.id)
    try {
      if (isPublishing) {
        // if the post is being manually published, remove any pending schedulers.
        // there should only ever be a single result here in practice
        const existingSchedules = await payload.find({
          collection: 'scheduled_posts',
          where: {
            post: {
              equals: {
                value: originalDoc?.id,
                relationTo: collection.slug,
              },
            },
          },
        })

        // @TODO onDelete hook for pub schedules, cancel the jobs
        await payload.delete({
          collection: 'scheduled_posts',
          where: {
            id: {
              in: existingSchedules.docs.map(({ id }) => id),
            },
          },
        })

        return data
      }

      if (scheduleChanged) {
        // ensure any prior schedule is removed
        await payload.delete({
          collection: 'scheduled_posts',
          where: {
            post: {
              equals: {
                value: originalDoc?.id,
                relationTo: 'articles',
              },
            },
          },
        })

        // if the new date is in the future, schedule it
        if (shouldSchedule) {
          await payload.create({
            collection: 'scheduled_posts',
            data: {
              post: {
                value: originalDoc?.id,
                relationTo: collection.slug,
              },
              date: data.publish_date,
              status: 'queued',
            },
          })
        }
      }
    } catch (error) {
      console.error('Error scheduling post')
      console.error(error)
    }

    return data
  }
}
