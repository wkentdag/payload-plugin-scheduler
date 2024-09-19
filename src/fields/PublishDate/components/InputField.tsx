import React, { useEffect, useState } from 'react'
import { stringify } from 'qs'

import { useFieldType, DateTimeInput, useFormFields, Label } from 'payload/components/forms'
import { useDocumentInfo } from 'payload/dist/admin/components/utilities/DocumentInfo'
import { type Props } from 'payload/components/fields/Text'
import { type ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types'

import { formatDateTime } from '../util'
import Icon from './Icon'
import { text } from './styles'

// https://payloadcms.com/blog/building-a-custom-field
// eslint-disable-next-line no-unused-vars
const InputField: (datePickerProps: ConditionalDateProps) => React.FC<Props> =
  datePickerProps => props => {
    const { label, required } = props

    const path = props.path!

    const {
      value = undefined,
      initialValue,
      setValue,
    } = useFieldType({
      path,
    })

    // db returns string, updates from date-picker return Date
    const pubDate = value && typeof value === 'object' ? (value as Date) : new Date(value as string)

    // eslint-disable-next-line no-underscore-dangle
    const status = useFormFields(([fields]) => fields._status)
    const scheduled = !!(value && status.value === 'draft' && pubDate > new Date())
    const schedulePending = value !== initialValue

    // verify that scheduled posts actually have a job
    const doc = useDocumentInfo()
    const [queued, setQueued] = useState<boolean>()

    useEffect(() => {
      async function verifySchedule() {
        const isGlobal = doc?.global !== undefined

        try {
          const qs = isGlobal ? {
            where: {
              global: {
                equals: doc.global?.slug
              }
            }
          } : {
            where: {
              and: [
                {
                  'post.value': {
                    equals: doc.id,
                  },
                },
                {
                  'post.relationTo': {
                    equals: doc.collection?.slug,
                  },
                },
              ],
            },
          }
          const req = await fetch(`/api/scheduled_posts?${stringify(qs)}`)
          const schedules = await req.json()
          if (schedules.docs[0]) {
            setQueued(schedules.docs[0].date === initialValue)
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('caught error')
          setQueued(false)
        }
      }

      if (scheduled) {
        verifySchedule()
      }
    }, [doc])

    // https://payloadcms.com/docs/admin/customizing-css#overriding-built-in-styles
    let color = 'var(--color-warning-650)'

    if (schedulePending) {
      color = 'var(--color-blue-650)'
    }

    // if `publish_date` is in the future but there's no queued job, something's gone wrong
    const scheduledButNotQueued = !schedulePending && scheduled && queued === false
    if (scheduledButNotQueued) {
      color = 'var(--color-error-650)'
    }

    const style = {
      ...text,
      color,
    }

    return (
      <div>
        <Label htmlFor={path} label={label} required={required} />
        <DateTimeInput
          path={path}
          value={value as Date | undefined}
          onChange={setValue}
          datePickerProps={datePickerProps}
          components={{}}
        />
        {scheduled && (
          <p style={style}>
            <Icon color={color} />
            {scheduledButNotQueued ? (
              <>Scheduling error</>
            ) : (
              <>Scheduled for {formatDateTime(pubDate)}</>
            )}
          </p>
        )}
      </div>
    )
  }

export default InputField
