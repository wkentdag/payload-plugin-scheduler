import type { CollectionAfterChangeHook } from 'payload'

import { normalizeScheduleConfig } from '../../src/config.js'
import syncSchedule from '../../src/hooks/syncSchedule.js'

const buildArgs = (data: Record<string, unknown>) => {
  const deleteMany = vi.fn().mockResolvedValue({ docs: [] })
  const queue = vi.fn().mockResolvedValue({ id: 'job-id' })
  const hook = syncSchedule(normalizeScheduleConfig({ collections: ['posts'] })) as CollectionAfterChangeHook

  return {
    args: {
      collection: {
        slug: 'posts',
      },
      doc: {
        id: 1,
        _status: 'draft',
        ...data,
      },
      previousDoc: {
        id: 1,
        _status: 'draft',
      },
      req: {
        payload: {
          db: {
            deleteMany,
          },
          jobs: {
            queue,
          },
          logger: {
            error: vi.fn(),
          },
        },
        user: {
          id: 1,
        },
      },
    },
    deleteMany,
    hook,
    queue,
  }
}

describe('syncSchedule', () => {
  it('omits timezone from schedulePublish job input by default', async () => {
    const publishDate = new Date(Date.now() + 60_000).toISOString()
    const { args, hook, queue } = buildArgs({
      publish_date: publishDate,
    })

    await hook(args as never)

    expect(queue).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.not.objectContaining({
        timezone: expect.any(String),
      }),
      waitUntil: new Date(publishDate),
    }))
  })

  it('passes companion timezone field into schedulePublish job input when present', async () => {
    const publishDate = new Date(Date.now() + 60_000).toISOString()
    const { args, hook, queue } = buildArgs({
      publish_date: publishDate,
      publish_date_tz: 'Europe/Berlin',
    })

    await hook(args as never)

    expect(queue).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        timezone: 'Europe/Berlin',
      }),
      waitUntil: new Date(publishDate),
    }))
  })
})
