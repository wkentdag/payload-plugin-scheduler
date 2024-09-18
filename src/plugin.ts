import type { Config, Plugin } from 'payload/config'

import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig, GlobalAfterChangeHook, GlobalBeforeChangeHook, GlobalConfig } from 'payload/types'
import type { ScheduledPostConfig } from './types'
import { onInit } from './init'
import syncSchedule from './hooks/syncSchedule'
import PublishDateField from './fields/PublishDate'
import ScheduledPosts from './collections/ScheduledPosts'
import deleteSchedule from './hooks/deleteSchedule'
import boundPublishDate from './hooks/boundPublishDate'

export const ScheduledPostPlugin =
  (incomingScheduleConfig: ScheduledPostConfig): Plugin =>
  (incomingConfig: Config): Config => {
    const scheduleConfig = {...incomingScheduleConfig }
    if (!scheduleConfig.interval) {
      scheduleConfig.interval = 5
    }

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
              ...collection,
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

      config.collections = [...collectionsWithScheduleHooks, ScheduledPosts(scheduleConfig)]
    }

    if (globals) {
      const enabledGlobals = scheduleConfig.globals || []

      const globalsWithScheduleHooks = globals.map(global => {
        const { hooks: existingHooks } = global
        const isEnabled = enabledGlobals.indexOf(global.slug) > -1

        if (isEnabled) {
          const decoratedConfig: GlobalConfig = {
            ...global,
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

    config.onInit = async payload => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      // Add additional onInit code by using the onInitExtension function
      onInit(scheduleConfig, payload)
    }

    return config
  }
