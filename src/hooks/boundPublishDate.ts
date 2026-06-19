import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'

import type { ScheduledPostConfig } from '../types.js'
import { getPublishDateFieldName } from '../util.js'

export default function boundPublishDate(
   
  scheduleConfig: ScheduledPostConfig,
): CollectionBeforeChangeHook | GlobalBeforeChangeHook {
  const publishDateFieldName = getPublishDateFieldName(scheduleConfig)

  return ({ data }: { data: any }) => {
     
    const isPublishing = data?._status === 'published'
    const pubDate = data?.[publishDateFieldName]
      ? new Date(data[publishDateFieldName])
      : undefined

    if (isPublishing && pubDate && pubDate > new Date()) {
      return {
        ...data,
        [publishDateFieldName]: new Date(),
      }
    }
    return data
  }
}
