import { CollectionBeforeDeleteHook } from 'payload/types'
import { ScheduledPostConfig } from '../types'
import { debug } from '../util'

export default function deleteSchedule(scheduleConfig: ScheduledPostConfig): CollectionBeforeDeleteHook {
  return async ({ id, collection, req }) => {
    debug(`deleteSchedule ${collection.slug} ${id}`)
    try {
      await req.payload.delete({
        collection: 'scheduled_posts',
        where: {
          and: [
            {
              'post.value': {
                equals: id,
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
    } catch (error) {
      req.payload.logger.error({
        err: `Error deleting schedule for ${collection.slug} ${id}: ${error}`,
      })
    }
  }
}
