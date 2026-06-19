import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Config,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  GlobalConfig,
  Plugin,
} from 'payload'

import { normalizeScheduleConfig } from './config.js'
import boundPublishDate from './hooks/boundPublishDate.js'
import deleteSchedule from './hooks/deleteSchedule.js'
import syncSchedule from './hooks/syncSchedule.js'
import type { ScheduledPostConfig } from './types.js'
import { resolvePublishDateFieldsForEntity, withScheduledPublishVersions } from './util.js'

export const ScheduledPostPlugin =
  (incomingScheduleConfig: ScheduledPostConfig): Plugin =>
  (incomingConfig: Config): Config => {
    const scheduleConfig = normalizeScheduleConfig(incomingScheduleConfig, incomingConfig)
    const timeIntervals = scheduleConfig.interval
    const publishDateFieldName = scheduleConfig.publishDate.name

    const config = { ...incomingConfig }
    const { collections, globals } = incomingConfig

    if (!collections && !globals) {
      throw new Error(`[payload-plugin-scheduler] At least one collection or global is required`)
    }

    if (collections) {
      const { collections: enabledCollections } = scheduleConfig

      const collectionsWithScheduleHooks = collections
        ?.map(collection => {
          const { hooks: existingHooks } = collection
          const isEnabled = enabledCollections.indexOf(collection.slug) > -1

          if (isEnabled) {
            const fields = resolvePublishDateFieldsForEntity({
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


      // ensure that publishDate field hasn't been manually added to any collections that aren't enabled by the plugin
      collections.forEach((collection) => {
        const isEnabled = enabledCollections.indexOf(collection.slug) > -1

        if (!isEnabled) {
          resolvePublishDateFieldsForEntity({
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
      const { globals: enabledGlobals } = scheduleConfig

      const globalsWithScheduleHooks = globals.map(global => {
        const { hooks: existingHooks } = global
        const isEnabled = enabledGlobals.indexOf(global.slug) > -1

        if (isEnabled) {
          const fields = resolvePublishDateFieldsForEntity({
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
          resolvePublishDateFieldsForEntity({
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
