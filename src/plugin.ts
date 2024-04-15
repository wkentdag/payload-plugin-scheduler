import type { Config, Plugin } from 'payload/config'

import type { ScheduledPostConfig } from './types'
import { onInit } from './init'
import syncSchedule from './hooks/syncSchedule'
import { CollectionConfig } from 'payload/types'
import PublishDateField from './fields/PublishDate'
import ScheduledPosts from './collections/ScheduledPosts'

export const ScheduledPostPlugin =
  (scheduleConfig: ScheduledPostConfig): Plugin =>
  (incomingConfig: Config): Config => {
    if (!scheduleConfig.interval) {
      scheduleConfig.interval = 15
    }

    const config = { ...incomingConfig }
    const { collections } = incomingConfig

    if (collections) {
      const enabledCollections = scheduleConfig.collections || []

      const collectionsWithScheduleHooks = collections
        ?.map(collection => {
          const { hooks: existingHooks } = collection
          const isEnabled = enabledCollections.indexOf(collection.slug) > -1

          if (isEnabled) {
            return {
              ...collection,
              fields: [...collection.fields, PublishDateField(scheduleConfig.interval!)],
              hooks: {
                ...collection.hooks,
                afterChange: [...(existingHooks?.afterChange || []), syncSchedule(scheduleConfig)],
                afterDelete: [
                  ...(existingHooks?.afterDelete || []),
                  // deleteFromSearch(scheduleConfig),
                ],
              },
            } as CollectionConfig
          }

          return collection
        })
        .filter(Boolean)

      config.collections = [...collectionsWithScheduleHooks, ScheduledPosts(scheduleConfig)]
    }

    config.onInit = async payload => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      // Add additional onInit code by using the onInitExtension function
      onInit(scheduleConfig, payload)
    }

    return config
  }
