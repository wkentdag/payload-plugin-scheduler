import { addMinutes } from 'date-fns'
import { type Payload } from 'payload'

describe('Plugin tests', () => {
  const payload = globalThis.payloadClient as Payload

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
    } = await payload.find({
      collection: 'scheduled_posts',
      where: {
        and: [
          {
            'post.value': {
              equals: doc.id,
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

    expect(totalDocs).toBe(1)
    expect(schedule.date).toBe(doc.publish_date)
    expect(schedule.status).toBe('queued')
  })
})
