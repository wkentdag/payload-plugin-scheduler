import { addMinutes } from 'date-fns'
import { type Payload } from 'payload'

const waitFor = (time: number) => new Promise(resolve => setTimeout(resolve, time))

// should match interval plugin option in payload.config.ts
const MINS = 1

describe('Plugin tests', () => {
  const payload = globalThis.payloadClient as Payload

  const findSchedule = id =>
    payload.find({
      collection: 'scheduled_posts',
      where: {
        and: [
          {
            'post.value': {
              equals: id,
            },
          },
          {
            'post.relationTo': {
              equals: 'posts',
            },
          },
        ],
      },
    })

  it('schedules posts', async () => {
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
    expect(schedule.date).toBe(doc.publish_date)
    expect(schedule.status).toBe('queued')
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

  it(
    'publishes scheduled posts',
    async () => {
      const now = new Date()
      const pubDate = addMinutes(now, MINS)
      const draft = await payload.create({
        collection: 'posts',
        data: {
          title: 'hello',
          publish_date: pubDate.toISOString(),
        },
      })

      const { totalDocs } = await findSchedule(draft.id)
      expect(totalDocs).toBe(1)

      // wait for the interval + 500ms
      await waitFor(1000 * 60 * MINS + 500)

      const publishedDraft = await payload.findByID({
        collection: 'posts',
        id: draft.id,
      })

      expect(publishedDraft._status).toBe('published')
      const { totalDocs: updatedTotalDocs } = await findSchedule(draft.id)
      expect(updatedTotalDocs).toBe(0)
    },
    // timeout = interval + 1 min
    1000 * 60 * (MINS + 1),
  )

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
    expect(docs[0].date).toBe(pubDate.toISOString())

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
    expect(updatedSchedules.docs[0].date).toBe(updatedPubDate)
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
    expect(docs[0].date).toBe(pubDate.toISOString())

    const updated = await payload.update({
      collection: 'posts',
      where: {
        id: {
          equals: draft.id,
        },
      },
      data: {
        // @ts-expect-error
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

    payload.delete({
      collection: 'posts',
      id: draft.id,
    })

    await waitFor(1000)

    const updatedSchedules = await findSchedule(draft.id)
    expect(updatedSchedules.totalDocs).toBe(0)
  })
})
