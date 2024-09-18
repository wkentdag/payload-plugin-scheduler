import type { GlobalAfterChangeHook, Where, CollectionAfterChangeHook } from 'payload/types'
import { type ScheduledPostConfig } from '../types'
import { debug } from '../util'

type GlobalArgs = Parameters<GlobalAfterChangeHook>[0]
type CollectionArgs = Parameters<CollectionAfterChangeHook>[0]

function isGlobal(args:  CollectionArgs| GlobalArgs): args is GlobalArgs {
  return (args as GlobalArgs).global !== undefined
}

export default function syncSchedule(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scheduleConfig: ScheduledPostConfig,
): CollectionAfterChangeHook | GlobalAfterChangeHook {
  return async (args: GlobalArgs | CollectionArgs) => {
    const { doc, previousDoc, req } = args
    const slug = isGlobal(args) ? args.global.slug : args.collection.slug
    
    const { payload } = req
    debug(`syncSchedule ${slug} ${doc.id}`)
    // eslint-disable-next-line no-underscore-dangle
    const isPublishing = doc._status === 'published'
    const publishInFuture = doc?.publish_date && new Date(doc.publish_date) > new Date()
    const scheduleChanged = doc?.publish_date !== previousDoc?.publish_date
    try {
      if (isPublishing || scheduleChanged) {
        debug('Deleting previous schedule')
        // if `publish_date` is modified, or the post is being published, remove any pending schedulers.
        // there should only ever be a single result here in practice
        const whereClause: Where = isGlobal(args) ? {
          global: {
            equals: slug,
          }
        } : {
          and: [
            {
              'post.value': {
                equals: doc.id,
              },
            },
            {
              'post.relationTo': {
                equals: slug,
              },
            },
          ],
        }

        const deleted = await payload.delete({
          collection: 'scheduled_posts',
          where: whereClause,
          req,
        })

        debug(`deleted ${deleted?.docs?.length} stale schedules`)

        if (isPublishing) {
          // if the post is being published, we're done
          debug(`publishing ${doc.id}`)
          return doc
        }
      }

      // if the publish date has changed and it's in the future, schedule it
      if (scheduleChanged && publishInFuture) {
        debug('Scheduling post', slug, doc.id)
        const data: Record<string, any> = {
          date: doc.publish_date,
          status: 'queued',
        }

        if (isGlobal(args)) {
          data.global = slug
        } else {
          let dbValue = doc.id

          // nb without this payload will throw a ValidationError
          // seems like a bug
          if (payload.db.defaultIDType === 'number') {
            dbValue = Number(doc.id)
          }

          data.post = {
            value: dbValue,
            relationTo: slug,
          }
        }

        const res = await payload.create({
          collection: 'scheduled_posts',
          data,
          req,
        })
                
        debug(`scheduled ${slug}:${doc.id} ${res.id}`)
      }
    } catch (error: unknown) {
      payload.logger.error('[payload-plugin-scheduler] Error scheduling post')
      payload.logger.error(error)
    }

    return doc
  }
}
