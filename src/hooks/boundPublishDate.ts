import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'

import type { ScheduledPostConfig } from '../types.js'

export default function boundPublishDate(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scheduleConfig: ScheduledPostConfig,
): CollectionBeforeChangeHook | GlobalBeforeChangeHook {
  return ({ data }: { data: any }) => {
     
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
