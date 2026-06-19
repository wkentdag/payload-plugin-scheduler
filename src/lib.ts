import type { PayloadRequest, Where } from 'payload'

export const jobsCollectionSlug = 'payload-jobs'
export const publishDateFieldCustomKey = 'payload-plugin-scheduler:publishDate'
// publishDate() runs while collection/global fields are declared, before the plugin
// can see its normalized config. Store manual display overrides here so the plugin
// can merge them with the global publishDate config during config decoration.
export const publishDateFieldOverridesCustomKey = 'payload-plugin-scheduler:publishDateOverrides'
export const schedulePublishTaskSlug = 'schedulePublish'

export type ScheduleTarget =
  | {
      id: number | string
      slug: string
      type: 'collection'
    }
  | {
      slug: string
      type: 'global'
    }

export const getScheduledPublishJobsWhere = (target: ScheduleTarget): Where => {
  return {
    and: [
      {
        completedAt: {
          exists: false,
        },
      },
      {
        processing: {
          equals: false,
        },
      },
      {
        taskSlug: {
          equals: schedulePublishTaskSlug,
        },
      },
      ...(target.type === 'global'
        ? [
            {
              'input.global': {
                equals: target.slug,
              },
            },
          ]
        : [
            {
              'input.doc.value': {
                equals: String(target.id),
              },
            },
            {
              'input.doc.relationTo': {
                equals: target.slug,
              },
            },
          ]),
    ],
  }
}

export const deleteScheduledPublishJobs = async ({
  req,
  target,
}: {
  req: PayloadRequest
  target: ScheduleTarget
}): Promise<number | undefined> => {
  const deleted = await req.payload.db.deleteMany({
    collection: jobsCollectionSlug as never,
    req,
    where: getScheduledPublishJobsWhere(target),
  })

  return (deleted as { docs?: unknown[] } | undefined)?.docs?.length
}
