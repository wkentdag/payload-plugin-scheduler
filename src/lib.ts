import { type JobCallback } from 'node-schedule'
import { type Payload } from 'payload'
import { type PaginatedDocs } from 'payload/dist/database/types'
import { addMinutes } from 'date-fns'
import { debug } from './util'
import { type ScheduledPost } from './types'

export async function getUpcomingPosts(
  interval: number,
  payload: Payload,
): Promise<PaginatedDocs<ScheduledPost>> {
  const now = new Date()
  const nextInterval = addMinutes(now, interval)

  debug(`Scanning for scheduled posts between \n${now} and \n${nextInterval}`)
  const publishSchedules = await payload.find({
    collection: 'scheduled_posts',
    where: {
      and: [
        {
          date: {
            greater_than_equal: now,
          },
        },
        {
          date: {
            less_than: nextInterval,
          },
        },
        {
          status: {
            equals: 'queued',
          },
        },
      ],
    },
    depth: 0,
  })

  // @ts-expect-error
  return publishSchedules
}

export function publishScheduledPost(
  { post }: Pick<ScheduledPost, 'post'>,
  payload: Payload,
): JobCallback {
  return async () => {
    payload.logger.info(`Publishing ${post.relationTo} ${post.value}`)
    debug(`Publishing ${post.relationTo} ${post.value}`)

    try {
      await payload.update({
        id: post.value,
        collection: post.relationTo,
        data: {
          _status: 'published',
        },
      })
      payload.logger.info(`[payload-plugin-scheduler] Published ${post.relationTo} ${post.value}`)
    } catch (error: unknown) {
      debug(`Error publishing ${post.relationTo} ${post.value} ${error?.toString()}`)
      payload.logger.error(error, 
        `[payload-plugin-scheduler] Failed to publish ${post.relationTo} ${post.value}`
      )
    }
  }
}
