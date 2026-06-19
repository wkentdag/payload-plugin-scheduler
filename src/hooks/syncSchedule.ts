import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

import { deleteScheduledPublishJobs, schedulePublishTaskSlug } from '../lib.js'
import { type NormalizedScheduledPostConfig } from '../types.js'
import { debug } from '../util.js'

type GlobalArgs = Parameters<GlobalAfterChangeHook>[0]
type CollectionArgs = Parameters<CollectionAfterChangeHook>[0]
type SchedulePublishInput = {
  doc?: {
    relationTo: string
    value: string
  }
  global?: string
  timezone?: string
  type: 'publish'
  user?: number | string
}

function isGlobal(args:  CollectionArgs| GlobalArgs): args is GlobalArgs {
  return (args as GlobalArgs).global !== undefined
}

export default function syncSchedule(
   
  scheduleConfig: NormalizedScheduledPostConfig,
): CollectionAfterChangeHook | GlobalAfterChangeHook {
  const publishDateFieldName = scheduleConfig.publishDate.name
  const timezoneFieldName = `${publishDateFieldName}_tz`

  return async (args: GlobalArgs | CollectionArgs) => {
    const { doc, previousDoc, req } = args
    const slug = isGlobal(args) ? args.global.slug : args.collection.slug

    const { payload } = req
    debug(`syncSchedule ${slug} ${doc.id}`)

    const isPublishing = doc._status === 'published'
    const publishDateValue = doc?.[publishDateFieldName]
    const timezone = doc?.[timezoneFieldName]
    const previousPublishDateValue = previousDoc?.[publishDateFieldName]
    const publishInFuture = publishDateValue && new Date(publishDateValue) > new Date()
    const scheduleChanged = publishDateValue !== previousPublishDateValue
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
        const input: SchedulePublishInput = isGlobal(args)
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

        if (typeof timezone === 'string') {
          input.timezone = timezone
        }

        const res = await payload.jobs.queue({
          input,
          req,
          task: schedulePublishTaskSlug,
          waitUntil: new Date(publishDateValue),
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
