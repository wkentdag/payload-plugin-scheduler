import { type JobCallback } from 'node-schedule'
import { type ScheduledPost } from './types'
import { type Payload } from 'payload'
import { debug } from './util'
import { type PaginatedDocs } from 'payload/dist/database/types'
import { type ValueWithRelation } from 'payload/types'

export async function getUpcomingPosts(
  interval: number,
  payload: Payload,
): Promise<PaginatedDocs<ScheduledPost>> {
  const now = new Date()
  const nextInterval = new Date(now)
  nextInterval.setMinutes(now.getMinutes() + interval)

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
  })

  // @ts-expect-error
  return publishSchedules
}

export function publishScheduledPost(
  { id, post }: Pick<ScheduledPost, 'id' | 'post'>,
  payload: Payload,
): JobCallback {
  return async fireDate => {
    debug(`publishing schedule ${id}`)

    try {
      // publish the post itself
      await Promise.all([
        payload.update({
          id: post.value.id,
          collection: post.relationTo,
          data: {
            _status: 'published',
          },
        }),
        // mark the schedule as complete
        payload.update({
          collection: 'scheduled_posts',
          id,
          data: {
            status: 'complete',
          },
        }),
      ])
      debug(`published!`)
    } catch (error) {
      console.error(`Failed to publish ${id}`)
      console.error(error)
    }
  }
}
