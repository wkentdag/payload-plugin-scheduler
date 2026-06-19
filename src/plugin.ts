import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Config,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  GlobalConfig,
  Plugin,
  Field,
} from 'payload'

import PublishDateField from './fields/PublishDate/index.js'
import boundPublishDate from './hooks/boundPublishDate.js'
import deleteSchedule from './hooks/deleteSchedule.js'
import syncSchedule from './hooks/syncSchedule.js'
import type { ScheduledPostConfig } from './types.js'
import { fieldHasName, flattenFields, getEntityLabel, getPublishDateFieldName, isPluginPublishDateField } from './util.js'

const withScheduledPublishVersions = <T extends CollectionConfig | GlobalConfig>(
  entity: T,
  timeIntervals: number,
): T => {
  const versions = typeof entity.versions === 'object' ? entity.versions : {}
  const existingDrafts = versions.drafts
  const drafts = typeof existingDrafts === 'object' ? existingDrafts : {}
  const existingSchedulePublish = drafts.schedulePublish
  const schedulePublish =
    typeof existingSchedulePublish === 'object' ? existingSchedulePublish : {}

  return {
    ...entity,
    versions: {
      ...versions,
      drafts: {
        ...drafts,
        schedulePublish: {
          ...schedulePublish,
          timeIntervals,
        },
      },
    },
  } as T
}

const getFieldsWithPublishDate = ({
  enabled,
  entityType,
  fields,
  fieldName,
  scheduleConfig,
  slug,
}: {
  enabled: boolean
  entityType: 'collection' | 'global'
  fields: Field[]
  fieldName: string
  scheduleConfig: ScheduledPostConfig & {
    timezone?: boolean
  }
  slug: string
}): Field[] => {
  const allFields = flattenFields(fields)
  const pluginFields = allFields.filter(isPluginPublishDateField)
  const label = getEntityLabel(entityType, slug)

  if (pluginFields.length > 0 && !enabled) {
    throw new Error(`[payload-plugin-scheduler] publishDate() can only be used in opted-in collections/globals. Found manual field in ${label}.`)
  }

  if (!enabled) {
    return fields
  }

  if (pluginFields.length === 1) {
    const [pluginField] = pluginFields

    if (!fieldHasName(pluginField, fieldName)) {
      throw new Error(`[payload-plugin-scheduler] ${label} publishDate() field name must match plugin config name "${fieldName}".`)
    }

    if (scheduleConfig.timezone) {
      return fields.map(field => withPublishDateTimezone(field))
    }

    return fields
  }

  const conflictingField = allFields.find((field) => fieldHasName(field, fieldName))

  if (conflictingField) {
    throw new Error(`[payload-plugin-scheduler] ${label} already has a non-plugin field named "${fieldName}". Use publishDate() or configure a different publishDate.name.`)
  }

  return [...fields, PublishDateField(scheduleConfig)]
}

const withPublishDateTimezone = (field: Field): Field => {
  if (isPluginPublishDateField(field)) {
    return {
      ...field,
      timezone: true,
    } as Field
  }

  if ('fields' in field && Array.isArray(field.fields)) {
    return {
      ...field,
      fields: field.fields.map(nestedField => withPublishDateTimezone(nestedField)),
    } as Field
  }

  if ('tabs' in field && Array.isArray(field.tabs)) {
    return {
      ...field,
      tabs: field.tabs.map((tab) => {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          return {
            ...tab,
            fields: tab.fields.map(nestedField => withPublishDateTimezone(nestedField)),
          }
        }

        return tab
      }),
    } as Field
  }

  return field
}

export const ScheduledPostPlugin =
  (incomingScheduleConfig: ScheduledPostConfig): Plugin =>
  (incomingConfig: Config): Config => {
    const scheduleConfig = {
      ...incomingScheduleConfig,
      timezone: Boolean(incomingConfig.admin?.timezones),
    }
    if (!scheduleConfig.interval) {
      scheduleConfig.interval = 5
    }
    const timeIntervals = scheduleConfig.interval
    const publishDateFieldName = getPublishDateFieldName(scheduleConfig)

    const config = { ...incomingConfig }
    const { collections, globals } = incomingConfig

    if (!collections && !globals) {
      throw new Error(`[payload-plugin-scheduler] At least one collection or global is required`)
    }

    if (collections) {
      const enabledCollections = scheduleConfig.collections || []

      const collectionsWithScheduleHooks = collections
        ?.map(collection => {
          const { hooks: existingHooks } = collection
          const isEnabled = enabledCollections.indexOf(collection.slug) > -1

          if (isEnabled) {
            const fields = getFieldsWithPublishDate({
              enabled: isEnabled,
              entityType: 'collection',
              fields: collection.fields,
              fieldName: publishDateFieldName,
              scheduleConfig,
              slug: collection.slug,
            })
            const decoratedConfig: CollectionConfig = {
              ...withScheduledPublishVersions(collection, timeIntervals),
              fields,
              hooks: {
                ...collection.hooks,
                afterChange: [...(existingHooks?.afterChange || []), syncSchedule(scheduleConfig) as CollectionAfterChangeHook],
                beforeDelete: [
                  ...(existingHooks?.beforeDelete || []),
                  deleteSchedule(scheduleConfig),
                ],
                beforeChange: [
                  ...(existingHooks?.beforeChange || []),
                  boundPublishDate(scheduleConfig) as CollectionBeforeChangeHook,
                ],
              },
            }
            return decoratedConfig
          }

          return collection
        })
        .filter(Boolean)

      collections.forEach((collection) => {
        const isEnabled = enabledCollections.indexOf(collection.slug) > -1

        if (!isEnabled) {
          getFieldsWithPublishDate({
            enabled: false,
            entityType: 'collection',
            fields: collection.fields,
            fieldName: publishDateFieldName,
            scheduleConfig,
            slug: collection.slug,
          })
        }
      })

      config.collections = collectionsWithScheduleHooks
    }

    if (globals) {
      const enabledGlobals = scheduleConfig.globals || []

      const globalsWithScheduleHooks = globals.map(global => {
        const { hooks: existingHooks } = global
        const isEnabled = enabledGlobals.indexOf(global.slug) > -1

        if (isEnabled) {
          const fields = getFieldsWithPublishDate({
            enabled: isEnabled,
            entityType: 'global',
            fields: global.fields,
            fieldName: publishDateFieldName,
            scheduleConfig,
            slug: global.slug,
          })
          const decoratedConfig: GlobalConfig = {
            ...withScheduledPublishVersions(global, timeIntervals),
            fields,
            hooks: {
              ...existingHooks,
              afterChange: [...(existingHooks?.afterChange || []), syncSchedule(scheduleConfig) as GlobalAfterChangeHook],
              beforeChange: [
                ...(existingHooks?.beforeChange || []),
                boundPublishDate(scheduleConfig) as GlobalBeforeChangeHook,
              ],
            }
          }

          return decoratedConfig
        }

        return global
      }).filter(Boolean)

      globals.forEach((global) => {
        const isEnabled = enabledGlobals.indexOf(global.slug) > -1

        if (!isEnabled) {
          getFieldsWithPublishDate({
            enabled: false,
            entityType: 'global',
            fields: global.fields,
            fieldName: publishDateFieldName,
            scheduleConfig,
            slug: global.slug,
          })
        }
      })

      config.globals = globalsWithScheduleHooks
    }

    config.jobs = {
      ...(incomingConfig.jobs || {}),
    }

    return config
  }
