import { addMinutes, addSeconds } from 'date-fns'
import { type Payload, type Where } from 'payload'

const waitFor = (time: number): Promise<void> => new Promise(resolve => setTimeout(resolve, time))

describe('Plugin tests', () => {
  const payload = globalThis.payloadClient as Payload

  const scheduledPublishJobWhere = (id: string | number): Where => ({
    and: [
      {
        'input.doc.value': {
          equals: String(id),
        },
      },
      {
        'input.doc.relationTo': {
          equals: 'posts',
        },
      },
      {
        taskSlug: {
          equals: 'schedulePublish',
        },
      },
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
    ],
  })

  const findSchedule = (id: string | number) =>
    payload.find({
      collection: 'payload-jobs',
      where: scheduledPublishJobWhere(id),
    })

  it('schedules collection docs', async () => {
    const pubDate = addMinutes(new Date(), 2).toISOString()
    const doc = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello',
        content: 'world',
        publish_date: pubDate,
      },
    })

    expect(doc.id).toBeTruthy()
    expect(doc.publish_date).toBe(pubDate)

    const {
      totalDocs,
      docs: [schedule],
    } = await findSchedule(doc.id)

    expect(totalDocs).toBe(1)
    expect(schedule.waitUntil).toBe(doc.publish_date)
    expect(schedule.taskSlug).toBe('schedulePublish')
    expect(schedule.input).toMatchObject({
      doc: {
        relationTo: 'posts',
        value: String(doc.id),
      },
      type: 'publish',
    })
  })

  it('schedules global docs', async () => {
    const pubDate = addMinutes(new Date(), 2).toISOString()
    const doc = await payload.updateGlobal({
      slug: 'home',
      data: {
        title: 'hello world',
        publish_date: pubDate,
        _status: 'draft',
      },
    })

    expect(doc.publish_date).toBe(pubDate)
    expect(doc._status).toBe('draft')

    const {
      totalDocs,
      docs: [schedule],
    } = await payload.find({
      collection: 'payload-jobs',
      where: {
        and: [
          {
            'input.global': {
              equals: 'home',
            },
          },
          {
            taskSlug: {
              equals: 'schedulePublish',
            },
          },
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
        ],
      },
    })

    expect(totalDocs).toBe(1)
    expect(schedule.waitUntil).toBe(doc.publish_date)
    expect(schedule.input).toMatchObject({
      global: 'home',
      type: 'publish',
    })
  })

  it('bounds publish_date', async () => {
    const now = new Date()
    const futureDate = addMinutes(now, 10)
    const doc = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello',
        content: 'world',
        publish_date: futureDate.toISOString(),
        _status: 'published',
      },
    })

    // if `publish_date` is in the future at publish time, should be reset to now
    const actualPublishDate = new Date(doc.publish_date as string)
    expect(actualPublishDate.getMinutes()).toBe(now.getMinutes())

    // shouldn't be scheduled either
    const { totalDocs } = await findSchedule(doc.id)
    expect(totalDocs).toBe(0)
  })

  it('publishes scheduled posts', async () => {
    const pubDate = addSeconds(new Date(), 1)
    const draft = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello',
        publish_date: pubDate.toISOString(),
      },
    })

    const { totalDocs } = await findSchedule(draft.id)
    expect(totalDocs).toBe(1)

    await waitFor(1500)
    await payload.jobs.run()

    const publishedDraft = await payload.findByID({
      collection: 'posts',
      id: draft.id,
    })

    expect(publishedDraft._status).toBe('published')
    const { totalDocs: updatedTotalDocs } = await findSchedule(draft.id)
    expect(updatedTotalDocs).toBe(0)
  })

  it('handles subsequent draft updates to pending posts', async () => {
    const now = new Date()
    const pubDate = addMinutes(now, 5)
    const draft = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello world',
        publish_date: pubDate.toISOString(),
      },
    })

    expect(draft.id).toBeTruthy()
    const { totalDocs, docs } = await findSchedule(draft.id)
    expect(totalDocs).toBe(1)
    expect(docs[0].waitUntil).toBe(pubDate.toISOString())

    const updatedPubDate = addMinutes(pubDate, 5).toISOString()
    await payload.update({
      collection: 'posts',
      data: {
        publish_date: updatedPubDate,
      },
      where: {
        id: {
          equals: draft.id,
        },
      },
    })

    const updatedSchedules = await findSchedule(draft.id)
    expect(updatedSchedules.totalDocs).toBe(1)
    expect(updatedSchedules.docs[0].waitUntil).toBe(updatedPubDate)
  })

  it('cancels pending schedules', async () => {
    const now = new Date()
    const pubDate = addMinutes(now, 5)
    const draft = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello world',
        publish_date: pubDate.toISOString(),
      },
    })

    const { totalDocs, docs } = await findSchedule(draft.id)
    expect(totalDocs).toBe(1)
    expect(docs[0].waitUntil).toBe(pubDate.toISOString())

    const updated = await payload.update({
      collection: 'posts',
      where: {
        id: {
          equals: draft.id,
        },
      },
      data: {
        publish_date: null,
      },
    })

    expect(updated.docs[0].publish_date).toBeNull()
    const updatedSchedule = await findSchedule(draft.id)
    expect(updatedSchedule.totalDocs).toBe(0)
  })

  it('handles delete docs', async () => {
    const now = new Date()
    const pubDate = addMinutes(now, 5)
    const draft = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello world',
        publish_date: pubDate.toISOString(),
      },
    })

    const { totalDocs } = await findSchedule(draft.id)
    expect(totalDocs).toBe(1)

    await payload.delete({
      collection: 'posts',
      id: draft.id,
    })

    await waitFor(2000)

    const updatedSchedules = await findSchedule(draft.id)
    expect(updatedSchedules.totalDocs).toBe(0)
  }, 9000)

  it('handles peer hook errors', async () => {
    const pubDate = addSeconds(new Date(), 1)
    const [draft, badDraft, badDraft2] = await Promise.all([
      payload.create({
        collection: 'pageswithextrahooks',
        data: {
          title: 'hello world',
          publish_date: pubDate.toISOString(),
        }
      }),
      payload.create({
        collection: 'pageswithextrahooks',
        data: {
          title: 'throw',
          publish_date: pubDate.toISOString(),
        }
      }),
      payload.create({
        collection: 'pageswithextrahooks',
        data: {
          title: 'commit-and-throw',
          publish_date: pubDate.toISOString(),
        }
      }),
    ])

    await waitFor(1500)
    await payload.jobs.run({
      limit: 10,
    })

    const [updatedDraft, updatedBadDraft, updatedBadDraft2] = await Promise.all([
      payload.findByID({
        collection: 'pageswithextrahooks',
        id: draft.id,
      }),
      payload.findByID({
        collection: 'pageswithextrahooks',
        id: badDraft.id,
      }),
      payload.findByID({
        collection: 'pageswithextrahooks',
        id: badDraft2.id,
      }),
    ])
    expect(updatedDraft._status).toBe('published')
    expect(updatedBadDraft._status).toBe('draft')
    expect(updatedBadDraft2._status).toBe('published')
  })
})
