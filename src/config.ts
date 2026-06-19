import type { Config, DateField } from 'payload'

import { publishDateFieldCustomKey } from './lib.js'
import type { NormalizedScheduledPostConfig, ReservedPublishDateComponentSlots, ScheduledPostConfig } from './types.js'

type PublishDateComponents = Pick<NonNullable<NonNullable<DateField['admin']>['components']>, ReservedPublishDateComponentSlots>

const publishDateComponents: PublishDateComponents = {
  afterInput: ['payload-plugin-scheduler/rsc#PublishDateAfterInputServer'],
  Cell: 'payload-plugin-scheduler/client#PublishDateCell',
}
const reservedPublishDateComponentSlots = Object.keys(publishDateComponents)

export const defaultOpts: NormalizedScheduledPostConfig = {
  collections: [],
  globals: [],
  interval: 5,
  publishDate: {
    name: 'publish_date',
    label: 'Publish Date',
    index: true,
    type: 'date',
    admin: {
      date: {
        pickerAppearance: 'dayAndTime',
        timeIntervals: 5,
      },
      position: 'sidebar',
      components: publishDateComponents,
    },
    custom: {
      [publishDateFieldCustomKey]: true,
    },
  },
}

export const normalizeScheduleConfig = (
  scheduleConfig: ScheduledPostConfig | NormalizedScheduledPostConfig,
  incomingConfig?: Config,
): NormalizedScheduledPostConfig => {
  const interval = scheduleConfig.interval ?? defaultOpts.interval
  const incomingPublishDate = scheduleConfig.publishDate ?? {}
  const defaultDateAdmin = defaultOpts.publishDate.admin
  const incomingDateAdmin = incomingPublishDate.admin

  reservedPublishDateComponentSlots.forEach((slot) => {
    const componentSlot = slot as keyof typeof publishDateComponents
    const components = incomingDateAdmin?.components as Partial<PublishDateComponents> | undefined
    const component = components?.[componentSlot]

    if (component && component !== publishDateComponents[componentSlot]) {
      throw new Error(`[payload-plugin-scheduler] publishDate.admin.components.${slot} is managed by the plugin`)
    }
  })

  return {
    collections: scheduleConfig.collections ? [...scheduleConfig.collections] : [...defaultOpts.collections],
    globals: scheduleConfig.globals ? [...scheduleConfig.globals] : [...defaultOpts.globals],
    interval,
    publishDate: {
      ...defaultOpts.publishDate,
      ...incomingPublishDate,
      type: 'date',
      admin: {
        ...defaultDateAdmin,
        ...incomingDateAdmin,
        date: {
          ...defaultDateAdmin?.date,
          ...incomingDateAdmin?.date,
          pickerAppearance: 'dayAndTime',
          timeIntervals: interval,
        } as NonNullable<NonNullable<DateField['admin']>['date']>,
        components: {
          ...incomingDateAdmin?.components,
          ...publishDateComponents,
        },
      },
      custom: {
        ...incomingPublishDate.custom,
        [publishDateFieldCustomKey]: true,
      },
      ...(incomingConfig?.admin?.timezones ? { timezone: true } : {}),
    },
  }
}
