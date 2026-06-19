import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'

import type { NormalizedScheduledPostConfig } from '../types.js'

export default function boundPublishDate(
   
  scheduleConfig: NormalizedScheduledPostConfig,
): CollectionBeforeChangeHook | GlobalBeforeChangeHook {
  const publishDateFieldName = scheduleConfig.publishDate.name

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
