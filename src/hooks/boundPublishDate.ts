import { CollectionBeforeChangeHook } from 'payload/types'
import { ScheduledPostConfig } from '../types'

export default function boundPublishDate(
  scheduleConfig: ScheduledPostConfig,
): CollectionBeforeChangeHook {
  return ({ data }) => {
    const isPublishing = data?._status === 'published'
    const pubDate = data?.publish_date ? new Date(data.publish_date) : undefined
    if (isPublishing && pubDate && pubDate > new Date()) {
      return {
        ...data,
        publish_date: new Date(),
      }
    } else {
      return data
    }
  }
}
