import type { CollectionConfig, Config, GlobalConfig } from 'payload'

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
  collections = [baseCollection()],
  globals,
  pluginConfig = {
    collections: ['posts'],
  },
}: {
  collections?: CollectionConfig[]
  globals?: GlobalConfig[]
  pluginConfig?: Parameters<typeof ScheduledPostPlugin>[0]
}): Config => {
  const plugin = ScheduledPostPlugin(pluginConfig)

  return plugin({
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
})
