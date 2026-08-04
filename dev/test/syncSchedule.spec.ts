import type { CollectionAfterChangeHook } from 'payload'

import { normalizeScheduleConfig } from '../../src/config.js'
import syncSchedule from '../../src/hooks/syncSchedule.js'

const buildArgs = (
  data: Record<string, unknown>,
  {
    executionAccess = 'user',
    target = 'collection',
    user = { id: 1 },
  }: {
    executionAccess?: 'override' | 'user'
    target?: 'collection' | 'global'
    user?: { id: number | string } | null
  } = {},
) => {
  const deleteMany = vi.fn().mockResolvedValue({ docs: [] })
  const queue = vi.fn().mockResolvedValue({ id: 'job-id' })
  const hook = syncSchedule(normalizeScheduleConfig({
    collections: ['posts'],
    executionAccess,
    globals: ['home'],
  })) as CollectionAfterChangeHook

  return {
    args: {
      ...(target === 'global'
        ? {
            global: {
              slug: 'home',
            },
          }
        : {
            collection: {
              slug: 'posts',
            },
          }),
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
        user: user ?? undefined,
      },
    },
    deleteMany,
    hook,
    queue,
  }
}

describe('syncSchedule', () => {
  it('stores the scheduling user in user-access jobs', async () => {
    const publishDate = new Date(Date.now() + 60_000).toISOString()
    const { args, hook, queue } = buildArgs({
      publish_date: publishDate,
    })

    await hook(args as never)

    expect(queue).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        user: 1,
      }),
    }))
  })

  it('omits the scheduling user from override-access jobs', async () => {
    const publishDate = new Date(Date.now() + 60_000).toISOString()
    const { args, hook, queue } = buildArgs({
      publish_date: publishDate,
    }, {
      executionAccess: 'override',
    })

    await hook(args as never)

    expect(queue).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.not.objectContaining({
        user: expect.anything(),
      }),
    }))
  })

  it('omits the scheduling user from override-access global jobs', async () => {
    const publishDate = new Date(Date.now() + 60_000).toISOString()
    const { args, hook, queue } = buildArgs({
      publish_date: publishDate,
    }, {
      executionAccess: 'override',
      target: 'global',
    })

    await hook(args as never)

    expect(queue).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.not.objectContaining({
        user: expect.anything(),
      }),
    }))
  })

  it('rejects user-access jobs without an authenticated user', async () => {
    const publishDate = new Date(Date.now() + 60_000).toISOString()
    const { args, hook, queue } = buildArgs({
      publish_date: publishDate,
    }, {
      user: null,
    })

    await expect(hook(args as never)).rejects.toThrow(
      'Cannot schedule a publish with executionAccess "user" without an authenticated user',
    )
    expect(queue).not.toHaveBeenCalled()
  })

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
