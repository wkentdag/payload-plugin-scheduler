import { type CollectionAfterChangeHook } from 'payload/types'
import { type ScheduledPostConfig } from '../types'
import { debug } from '../util'

export default function syncSchedule(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scheduleConfig: ScheduledPostConfig,
): CollectionAfterChangeHook {
  return async ({ collection, doc, previousDoc, req }) => {
    const { payload } = req
    debug(`syncSchedule ${collection.slug} ${doc.id}`)
    // eslint-disable-next-line no-underscore-dangle
    const isPublishing = doc._status === 'published'
    const publishInFuture = doc?.publish_date && new Date(doc.publish_date) > new Date()
    const scheduleChanged = doc?.publish_date !== previousDoc?.publish_date
    try {
      if (isPublishing || scheduleChanged) {
        debug('Deleting previous schedule')
        // if `publish_date` is modified, remove any pending schedulers.
        // there should only ever be a single result here in practice
        const deleted = await payload.delete({
          collection: 'scheduled_posts',
          where: {
            and: [
              {
                'post.value': {
                  equals: doc.id,
                },
              },
              {
                'post.relationTo': {
                  equals: collection.slug,
                },
              },
            ],
          },
          req,
        })

        debug(`$deleted ${deleted?.docs?.length} previous schedules`)

        if (isPublishing) {
          // if the post is being published, we're done
          return doc
        }
      }

      // if the publish date has changed and it's in the future, schedule it
      if (scheduleChanged && publishInFuture) {
        debug('Scheduling post', collection.slug, doc.id)
        let dbValue = doc.id

        // nb without this payload will throw a ValidationError
        // seems like a bug
        if (payload.db.defaultIDType === 'number') {
          dbValue = Number(doc.id)
        }

        const res = await payload.create({
          collection: 'scheduled_posts',
          data: {
            post: {
              value: dbValue,
              relationTo: collection.slug,
            },
            date: doc.publish_date,
            status: 'queued',
          },
          req,
        })
                
        debug(`[payload-plugin-scheduler] scheduled ${collection.slug}:${dbValue} ${res.id}`)
      }
    } catch (error: unknown) {
      payload.logger.error('[payload-plugin-scheduler] Error scheduling post')
      payload.logger.error(error)
    }

    return doc
  }
}
