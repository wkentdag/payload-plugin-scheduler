import React from 'react'
import type { DateFieldServerComponent } from 'payload'
import { getScheduledPublishJobsWhere, type ScheduleTarget } from '../../../../lib.js'
import AfterInputClient from './client.js'

const resolveScheduleTarget = ({
  collectionSlug,
  data,
  id,
  schemaPath,
  siblingData,
}: {
  collectionSlug?: string
  data?: Record<string, unknown>
  id?: number | string
  schemaPath?: string
  siblingData?: Record<string, unknown>
}): null | ScheduleTarget => {
  const globalSlugFromData =
    typeof data?.globalType === 'string' ? data.globalType : undefined

  // Payload uses '-' as collectionSlug for globals in its on-demand field renderer.
  const hasCollectionSlug = Boolean(collectionSlug && collectionSlug !== '-')
  const globalSlug =
    globalSlugFromData ||
    (!hasCollectionSlug && typeof schemaPath === 'string'
      ? schemaPath.split('.')[0]
      : undefined)

  if (globalSlug) {
    return {
      slug: globalSlug,
      type: 'global',
    }
  }

  const docId = id ?? siblingData?.id

  if (hasCollectionSlug && docId != null) {
    return {
      id: docId as number | string,
      slug: collectionSlug!,
      type: 'collection',
    }
  }

  return null
}

const AfterInputServer: DateFieldServerComponent = async ({
  collectionSlug,
  data,
  id,
  path,
  payload,
  schemaPath,
  siblingData,
  value,
}) => {
  const scheduleTarget = resolveScheduleTarget({
    collectionSlug,
    data,
    id,
    schemaPath,
    siblingData,
  })

  let scheduledAt: string | undefined

  if (scheduleTarget) {
    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: getScheduledPublishJobsWhere(scheduleTarget),
    })

    scheduledAt = scheduledJobs.docs[0]?.waitUntil as string | undefined
  }

  return (
    <AfterInputClient
      currentFormValue={value}
      path={path}
      scheduledAt={scheduledAt}
      status={siblingData?._status}
    />
  )
}

export default AfterInputServer