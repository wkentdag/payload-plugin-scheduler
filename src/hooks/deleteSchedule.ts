import type { CollectionBeforeDeleteHook } from 'payload'

import { deleteScheduledPublishJobs } from '../lib.js'
import type { NormalizedScheduledPostConfig } from '../types.js'
import { debug } from '../util.js'

export default function deleteSchedule(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scheduleConfig: NormalizedScheduledPostConfig,
): CollectionBeforeDeleteHook {
  return async ({ id, collection, req }) => {
    debug(`deleteSchedule ${collection.slug} ${id}`)
    try {
      await deleteScheduledPublishJobs({
        req,
        target: {
          id,
          slug: collection.slug,
          type: 'collection',
        },
      })
    } catch (error: unknown) {
      req.payload.logger.error({
        err: `Error deleting schedule for ${collection.slug} ${id}: ${error}`,
      })
    }
  }
}
