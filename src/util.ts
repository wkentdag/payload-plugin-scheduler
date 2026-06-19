import type { Field } from 'payload'
import db from 'debug'

import { publishDateFieldCustomKey } from './lib.js'
import type { ScheduledPostConfig } from './types.js'

export const debug = db('payload-plugin-scheduler')

export const getPublishDateFieldName = (scheduleConfig: ScheduledPostConfig): string => {
  return scheduleConfig.publishDate?.name || 'publish_date'
}

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

export const getPublishDateFieldNameFromFields = (fields: Field[]): string => {
  const publishDateField = flattenFields(fields).find(isPluginPublishDateField)

  if (publishDateField && 'name' in publishDateField) {
    return publishDateField.name
  }

  return 'publish_date'
}

export const fieldHasName = (field: Field, name: string): boolean => {
  return 'name' in field && field.name === name
}

export const getEntityLabel = (type: 'collection' | 'global', slug: string): string => {
  return `${type} "${slug}"`
}