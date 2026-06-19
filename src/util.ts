import type { CollectionConfig, Field, GlobalConfig } from 'payload'
import db from 'debug'

import { resolvePublishDateField } from './config.js'
import {
  publishDateFieldCustomKey,
  publishDateFieldOverridesCustomKey,
} from './lib.js'
import type { ManualPublishDateFieldOptions, NormalizedScheduledPostConfig } from './types.js'
import PublishDateField from './fields/PublishDate/index.js'

export const debug = db('payload-plugin-scheduler')

export const flattenFields = (fields: Field[]): Field[] => {
  return fields.flatMap((field) => {
    const nestedFields: Field[] = []

    if ('fields' in field && Array.isArray(field.fields)) {
      nestedFields.push(...flattenFields(field.fields))
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      field.tabs.forEach((tab) => {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          nestedFields.push(...flattenFields(tab.fields))
        }
      })
    }

    return [field, ...nestedFields]
  })
}

export const isPluginPublishDateField = (field: Field): boolean => {
  return 'custom' in field && field.custom?.[publishDateFieldCustomKey] === true
}

export const getPublishDateFieldNameFromFields = (fields: Field[]): string | undefined => {
  const publishDateField = flattenFields(fields).find(isPluginPublishDateField)
  return (publishDateField as Field & { name: string })?.name
}

export const fieldHasName = (field: Field, name: string): boolean => {
  return 'name' in field && field.name === name
}

const getManualPublishDateFieldOverrides = (field: Field): ManualPublishDateFieldOptions => {
  if ('custom' in field && field.custom?.[publishDateFieldOverridesCustomKey]) {
    return field.custom[publishDateFieldOverridesCustomKey] as ManualPublishDateFieldOptions
  }

  return {}
}

/**
 * Manual publishDate() fields only mark placement. During config decoration,
 * replace them with the normalized global field config plus any manual display
 * overrides stored by publishDate().
 */
export const applyManualPublishDateFieldOverrides = (
  field: Field,
  scheduleConfig: NormalizedScheduledPostConfig,
): Field => {
  if (isPluginPublishDateField(field)) {
    return resolvePublishDateField(scheduleConfig, getManualPublishDateFieldOverrides(field)) as Field
  }

  if ('fields' in field && Array.isArray(field.fields)) {
    return {
      ...field,
      fields: field.fields.map(nestedField => applyManualPublishDateFieldOverrides(nestedField, scheduleConfig)),
    } as Field
  }

  if ('tabs' in field && Array.isArray(field.tabs)) {
    return {
      ...field,
      tabs: field.tabs.map((tab) => {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          return {
            ...tab,
            fields: tab.fields.map(nestedField => applyManualPublishDateFieldOverrides(nestedField, scheduleConfig)),
          }
        }

        return tab
      }),
    } as Field
  }

  return field
}

/**For each configured collection/global, validate any manually placed
 * publishDate() field, prevent name collisions, and auto-inject the field when
 * the entity is opted in but has not placed it manually.
 */ 
export const resolvePublishDateFieldsForEntity = ({
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
  scheduleConfig: NormalizedScheduledPostConfig
  slug: string
}): Field[] => {
  const allFields = flattenFields(fields)
  const pluginFields = allFields.filter(isPluginPublishDateField)
  const label = `${entityType} "${slug}"`

  if (pluginFields.length > 0 && !enabled) {
    throw new Error(`[payload-plugin-scheduler] publishDate() can only be used in opted-in collections/globals. Found manual field in ${label}.`)
  }

  if (!enabled) {
    return fields
  }

  if (pluginFields.length === 1) {
    return fields.map(field => applyManualPublishDateFieldOverrides(field, scheduleConfig))
  }

  const conflictingField = allFields.find((field) => fieldHasName(field, fieldName))

  if (conflictingField) {
    throw new Error(`[payload-plugin-scheduler] ${label} already has a non-plugin field named "${fieldName}". Use publishDate() or configure a different publishDate.name.`)
  }

  return [...fields, PublishDateField(scheduleConfig)]
}

/**
 * Merge the plugin's schedulePublish settings into the entity's versions.drafts.schedulePublish settings.
 */
export const withScheduledPublishVersions = <T extends CollectionConfig | GlobalConfig>(
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
