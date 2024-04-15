import { CollectionAfterChangeHook } from 'payload/types'
import { ScheduledPost, ScheduledPostConfig } from '../types'

import { debug } from '../util'
import { PaginatedDocs } from 'payload/dist/database/types'

export default function syncSchedule(
  scheduleConfig: ScheduledPostConfig,
): CollectionAfterChangeHook {
  return async ({ collection, doc, previousDoc, req: { payload } }) => {
    debug(collection?.slug, doc?.id)
    const isPublishing = doc._status === 'published'
    const shouldSchedule = doc.publish_date && new Date(doc.publish_date) > new Date()
    const scheduleChanged = doc.publish_date !== previousDoc?.publish_date
    try {
      if (isPublishing) {
        // if the post is being published, remove any pending schedulers.
        // there should only ever be a single result here in practice
        const existingSchedules: PaginatedDocs<ScheduledPost> = await payload.find({
          collection: 'scheduled_posts',
          where: {
            post: {
              equals: {
                value: doc?.id,
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

        return doc
      }

      if (scheduleChanged) {
        // ensure any prior schedule is removed
        await payload.delete({
          collection: 'scheduled_posts',
          where: {
            post: {
              equals: {
                value: doc?.id,
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
                value: doc?.id,
                relationTo: collection.slug,
              },
              date: doc.publish_date,
              status: 'queued',
            },
          })
        }
      }
    } catch (error) {
      console.error('Error scheduling post')
      console.error(error)
    }

    return doc
  }
}
