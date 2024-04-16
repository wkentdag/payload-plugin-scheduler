import type { CollectionBeforeChangeHook } from 'payload/types'
import type { ScheduledPostConfig } from '../types'

export default function boundPublishDate(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scheduleConfig: ScheduledPostConfig,
): CollectionBeforeChangeHook {
  return ({ data }) => {
    // eslint-disable-next-line no-underscore-dangle
    const isPublishing = data?._status === 'published'
    const pubDate = data?.publish_date ? new Date(data.publish_date) : undefined
    if (isPublishing && pubDate && pubDate > new Date()) {
      return {
        ...data,
        publish_date: new Date(),
      }
    }
    return data
  }
}
