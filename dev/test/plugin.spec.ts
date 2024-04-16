import { addMinutes } from 'date-fns'
import { type Payload } from 'payload'

const waitFor = (time: number) => new Promise(resolve => setTimeout(resolve, time))
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

      await waitFor(1000 * 60 * MINS + 500)

      const publishedDraft = await payload.findByID({
        collection: 'posts',
        id: draft.id,
      })

      expect(publishedDraft._status).toBe('published')
      const { totalDocs: updatedTotalDocs } = await findSchedule(draft.id)
      expect(updatedTotalDocs).toBe(0)
    },
    1000 * 60 * (MINS + 1),
  )
})
