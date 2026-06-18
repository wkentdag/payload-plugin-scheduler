import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

import { deleteScheduledPublishJobs, schedulePublishTaskSlug } from '../lib.js'
import { type ScheduledPostConfig } from '../types.js'
import { debug } from '../util.js'

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

    const isPublishing = doc._status === 'published'
    const publishInFuture = doc?.publish_date && new Date(doc.publish_date) > new Date()
    const scheduleChanged = doc?.publish_date !== previousDoc?.publish_date
    try {
      if (isPublishing || scheduleChanged) {
        debug('Deleting previous schedule')
        const deleted = await deleteScheduledPublishJobs({
          req,
          target: isGlobal(args)
            ? {
                slug,
                type: 'global',
              }
            : {
                id: doc.id,
                slug,
                type: 'collection',
              },
        })

        debug(`deleted ${deleted ?? 0} stale schedules`)

        if (isPublishing) {
          // if the post is being published, we're done
          debug(`publishing ${doc.id}`)
          return doc
        }
      }

      // if the publish date has changed and it's in the future, schedule it
      if (scheduleChanged && publishInFuture) {
        debug('Scheduling post', slug, doc.id)
        const input = isGlobal(args)
          ? {
              global: slug,
              type: 'publish',
              user: req.user?.id,
            }
          : {
              doc: {
                relationTo: slug,
                value: String(doc.id),
              },
              type: 'publish',
              user: req.user?.id,
            }

        const res = await payload.jobs.queue({
          input,
          req,
          task: schedulePublishTaskSlug,
          waitUntil: new Date(doc.publish_date),
        } as Parameters<typeof payload.jobs.queue>[0])

        debug(`scheduled ${slug}:${doc.id} ${res.id}`)
      }
    } catch (error: unknown) {
      payload.logger.error('[payload-plugin-scheduler] Error scheduling post')
      payload.logger.error(error)
    }

    return doc
  }
}
