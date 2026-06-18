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

import PublishDateField from './fields/PublishDate/index.js'
import boundPublishDate from './hooks/boundPublishDate.js'
import deleteSchedule from './hooks/deleteSchedule.js'
import syncSchedule from './hooks/syncSchedule.js'
import type { ScheduledPostConfig } from './types.js'

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

export const ScheduledPostPlugin =
  (incomingScheduleConfig: ScheduledPostConfig): Plugin =>
  (incomingConfig: Config): Config => {
    const scheduleConfig = {...incomingScheduleConfig }
    if (!scheduleConfig.interval) {
      scheduleConfig.interval = 5
    }
    const timeIntervals = scheduleConfig.interval

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
            const decoratedConfig: CollectionConfig = {
              ...withScheduledPublishVersions(collection, timeIntervals),
              fields: [...collection.fields, PublishDateField(scheduleConfig)],
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

      config.collections = collectionsWithScheduleHooks
    }

    if (globals) {
      const enabledGlobals = scheduleConfig.globals || []

      const globalsWithScheduleHooks = globals.map(global => {
        const { hooks: existingHooks } = global
        const isEnabled = enabledGlobals.indexOf(global.slug) > -1

        if (isEnabled) {
          const decoratedConfig: GlobalConfig = {
            ...withScheduledPublishVersions(global, timeIntervals),
            fields: [...global.fields, PublishDateField(scheduleConfig)],
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

      config.globals = globalsWithScheduleHooks
    }

    config.jobs = {
      ...(incomingConfig.jobs || {}),
    }

    return config
  }
