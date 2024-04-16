import { CollectionAfterDeleteHook } from 'payload/types'
import { ScheduledPostConfig } from '../types'

export default function deleteSchedule(
  scheduleConfig: ScheduledPostConfig,
): CollectionAfterDeleteHook {
  return async ({ doc, collection, req: { payload } }) => {
    try {
      await payload.delete({
        collection: 'post_schedules',
        where: {
          'post.value': {
            equals: doc.id,
          },
        },
      })
    } catch (error) {
      payload.logger.error({
        err: `Error deleting schedule for ${collection.slug} ${doc.id}: ${error}`,
      })
    }

    return doc
  }
}
