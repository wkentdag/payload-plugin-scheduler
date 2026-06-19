import type { DateFieldServerComponent } from "payload"
import { getScheduledPublishJobsWhere, type ScheduleTarget } from "../../../../lib.js"
import AfterInputClient from "./client.js"

const AfterInputServer: DateFieldServerComponent = async ({ value, siblingData, payload, collectionSlug, data, path }) => {
  const isGlobal = data?.globalType !== undefined
  const scheduleWhere: ScheduleTarget = isGlobal ? { type: 'global', slug: data.globalType } : { type: 'collection', id: siblingData?.id as number, slug: collectionSlug }

  const scheduledJobs = await payload.find({
    collection: 'payload-jobs',
    where: getScheduledPublishJobsWhere(scheduleWhere),
  })
  const scheduledJob = scheduledJobs.docs[0]

  return (
    <AfterInputClient
      scheduledAt={scheduledJob?.waitUntil}
      path={path}
      currentFormValue={value}
      status={siblingData?._status}
    />
  )
}

export default AfterInputServer