import { buildConfig, type CollectionConfig, type Config, type GlobalConfig } from 'payload'

import { publishDate, ScheduledPostPlugin } from '../../src/index.js'
import { isPluginPublishDateField } from '../../src/util.js'

const baseCollection = (fields: CollectionConfig['fields'] = []): CollectionConfig => ({
  slug: 'posts',
  fields,
})

const baseGlobal = (fields: GlobalConfig['fields'] = []): GlobalConfig => ({
  slug: 'home',
  fields,
})

const applyPlugin = ({
  admin,
  collections = [baseCollection()],
  globals,
  pluginConfig = {
    collections: ['posts'],
  },
}: {
  admin?: Config['admin']
  collections?: CollectionConfig[]
  globals?: GlobalConfig[]
  pluginConfig?: Parameters<typeof ScheduledPostPlugin>[0]
}): Config => {
  const plugin = ScheduledPostPlugin(pluginConfig)

  return plugin({
    admin,
    collections,
    globals,
  } as Config) as Config
}

const getCollection = (config: Config, slug = 'posts'): CollectionConfig => {
  const collection = config.collections?.find((each) => each.slug === slug)

  if (!collection) {
    throw new Error(`Collection ${slug} not found`)
  }

  return collection
}

const getGlobal = (config: Config, slug = 'home'): GlobalConfig => {
  const global = config.globals?.find((each) => each.slug === slug)

  if (!global) {
    throw new Error(`Global ${slug} not found`)
  }

  return global
}

describe('plugin config', () => {
  it('uses custom publish-date field config', () => {
    const config = applyPlugin({
      pluginConfig: {
        collections: ['posts'],
        publishDate: {
          admin: {
            position: 'main',
          },
          label: 'Scheduled For',
          name: 'scheduled_for',
        },
      },
    })
    const collection = getCollection(config)
    const field = collection.fields.find((each) => 'name' in each && each.name === 'scheduled_for')

    expect(field).toBeTruthy()
    expect(field).toMatchObject({
      admin: {
        position: 'main',
      },
      label: 'Scheduled For',
      type: 'date',
    })
    expect(field && isPluginPublishDateField(field)).toBe(true)
  })

  it('preserves configurable publish-date DateField options', () => {
    const config = applyPlugin({
      pluginConfig: {
        collections: ['posts'],
        interval: 15,
        publishDate: {
          admin: {
            description: 'Future publication time',
            date: {
              displayFormat: 'MMM d, yyyy h:mm a',
            },
          },
          defaultValue: '2026-01-01T00:00:00.000Z',
        },
      },
    })
    const collection = getCollection(config)
    const field = collection.fields.find(isPluginPublishDateField)

    expect(field).toMatchObject({
      admin: {
        date: {
          displayFormat: 'MMM d, yyyy h:mm a',
          timeIntervals: 15,
        },
        description: 'Future publication time',
      },
      defaultValue: '2026-01-01T00:00:00.000Z',
    })
  })

  it('throws when publish-date reserved component slots are configured', () => {
    expect(() => applyPlugin({
      pluginConfig: {
        collections: ['posts'],
        publishDate: {
          admin: {
            components: {
              afterInput: ['payload-plugin-scheduler/client#PublishDateCell'],
            } as never,
          },
        },
      },
    })).toThrow('publishDate.admin.components.afterInput is managed by the plugin')
  })

  it('does not auto-inject a duplicate when publishDate() is manually placed', () => {
    const manualField = publishDate()
    const config = applyPlugin({
      collections: [
        baseCollection([
          {
            name: 'title',
            type: 'text',
          },
          manualField,
        ]),
      ],
    })
    const collection = getCollection(config)
    const publishDateFields = collection.fields.filter(isPluginPublishDateField)

    expect(publishDateFields).toHaveLength(1)
    expect(publishDateFields[0]).toBe(manualField)
  })

  it('throws when publishDate() is manually placed outside opted-in collections', () => {
    expect(() => applyPlugin({
      collections: [
        {
          ...baseCollection([publishDate()]),
          slug: 'not-enabled',
        },
      ],
      pluginConfig: {
        collections: ['posts'],
      },
    })).toThrow('publishDate() can only be used in opted-in collections/globals')
  })

  it('throws on non-plugin field name conflicts', () => {
    expect(() => applyPlugin({
      collections: [
        baseCollection([
          {
            name: 'publish_date',
            type: 'text',
          },
        ]),
      ],
    })).toThrow('already has a non-plugin field named "publish_date"')
  })

  it('throws when manually placed publishDate() uses a different configured name', () => {
    expect(() => applyPlugin({
      collections: [
        baseCollection([publishDate()]),
      ],
      pluginConfig: {
        collections: ['posts'],
        publishDate: {
          name: 'scheduled_for',
        },
      },
    })).toThrow('publishDate() field name must match plugin config name "scheduled_for"')
  })

  it('supports manual publishDate() placement in opted-in globals', () => {
    const manualField = publishDate()
    const config = applyPlugin({
      collections: [],
      globals: [
        baseGlobal([manualField]),
      ],
      pluginConfig: {
        globals: ['home'],
      },
    })
    const global = getGlobal(config)
    const publishDateFields = global.fields.filter(isPluginPublishDateField)

    expect(publishDateFields).toHaveLength(1)
    expect(publishDateFields[0]).toBe(manualField)
  })

  it('leaves publish-date timezone unset by default', () => {
    const config = applyPlugin({})
    const collection = getCollection(config)
    const field = collection.fields.find(isPluginPublishDateField)

    expect(field).toBeTruthy()
    expect(field).not.toHaveProperty('timezone')
  })

  it('enables publish-date timezone when admin.timezones is configured', () => {
    const config = applyPlugin({
      admin: {
        timezones: {
          defaultTimezone: 'Europe/Berlin',
        },
      },
    })
    const collection = getCollection(config)
    const field = collection.fields.find(isPluginPublishDateField)

    expect(field).toBeTruthy()
    expect(field).toMatchObject({
      timezone: true,
    })
  })

  it('inherits top-level admin.timezones for Payload timezone picker config', async () => {
    const config = await buildConfig({
      admin: {
        timezones: {
          defaultTimezone: 'Europe/Berlin',
          supportedTimezones: [
            {
              label: 'Berlin',
              value: 'Europe/Berlin',
            },
            {
              label: 'Pacific Time',
              value: 'America/Los_Angeles',
            },
          ],
        },
      },
      collections: [baseCollection()],
      plugins: [
        ScheduledPostPlugin({
          collections: ['posts'],
        }),
      ],
      secret: 'test-secret',
    })
    const collection = getCollection(config)
    const timezoneField = collection.fields.find((field) => 'name' in field && field.name === 'publish_date_tz')

    expect(timezoneField).toMatchObject({
      defaultValue: 'Europe/Berlin',
      name: 'publish_date_tz',
      options: [
        {
          label: 'Berlin',
          value: 'Europe/Berlin',
        },
        {
          label: 'Pacific Time',
          value: 'America/Los_Angeles',
        },
      ],
      type: 'select',
    })
  })
})
