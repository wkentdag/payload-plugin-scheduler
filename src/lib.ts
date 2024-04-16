import { type JobCallback } from 'node-schedule'
import { type ScheduledPost } from './types'
import { type Payload } from 'payload'
import { debug } from './util'
import { type PaginatedDocs } from 'payload/dist/database/types'
import { addMinutes } from 'date-fns'

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

export async function publishScheduledPost(
  { id, post }: Pick<ScheduledPost, 'id' | 'post'>,
  payload: Payload,
) {
  debug(`Publishing ${post.relationTo} ${post.value}`)

  try {
    await payload.update({
      id: post.value,
      collection: post.relationTo,
      data: {
        _status: 'published',
      },
    }),
      payload.logger.info(`[payload-plugin-scheduler] Published ${post.relationTo} ${post.value}`)
  } catch (error) {
    payload.logger.error(
      `[payload-plugin-scheduler] Failed to publish ${post.relationTo} ${post.value}`,
    )
    payload.logger.error(error)
  }
}
