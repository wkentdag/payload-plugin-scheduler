import { type CollectionAfterChangeHook } from 'payload/types'
import { type ScheduledPostConfig } from '../types'
import { debug } from '../util'

export default function syncSchedule(
  scheduleConfig: ScheduledPostConfig,
): CollectionAfterChangeHook {
  return async ({ collection, doc, previousDoc, req }) => {
    const { payload } = req
    debug(`syncSchedule ${collection.slug} ${doc.id}`)
    const isPublishing = doc._status === 'published'
    const shouldSchedule = doc?.publish_date && new Date(doc.publish_date) > new Date()
    const scheduleChanged = doc?.publish_date !== previousDoc?.publish_date
    try {
      if (isPublishing || scheduleChanged) {
        debug('Deleting previous schedule')
        // if `publish_date` is modified, remove any pending schedulers.
        // there should only ever be a single result here in practice
        await payload.delete({
          collection: 'scheduled_posts',
          where: {
            'post.value': {
              equals: doc.id,
            },
          },
          req,
        })

        if (isPublishing) {
          return doc
        }
      }

      if (shouldSchedule) {
        debug('Scheduling post', collection.slug, doc.id)
        // if the new date is in the future, schedule it
        await payload.create({
          collection: 'scheduled_posts',
          data: {
            post: {
              value: Number(doc.id),
              relationTo: collection.slug,
            },
            date: doc.publish_date,
            status: 'queued',
          },
          req,
        })
      }
    } catch (error) {
      payload.logger.error('[payload-plugin-scheduler] Error scheduling post')
      payload.logger.error(error)
    }

    return doc
  }
}
