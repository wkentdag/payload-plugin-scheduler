import React, { useEffect, useState } from 'react'

// this is how we'll interface with Payload itself
import { useFieldType, DateTimeInput, useFormFields } from 'payload/components/forms'
import { useDocumentInfo } from 'payload/dist/admin/components/utilities/DocumentInfo'

// we'll re-use the built in Label component directly from Payload
import { Label } from 'payload/components/forms'

// we can use existing Payload types easily
import { Props } from 'payload/components/fields/Text'
import { stringify } from 'qs'

// we'll import and reuse our existing validator function on the frontend, too
// import { validateHexColor } from './config';

// Import the SCSS stylesheet
import './styles.scss'
import { ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types'
import { formatDateTime } from '../util'
import Icon from './Icon'

const baseClass = 'scheduler-publish-at'

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
      // validate: validateHexColor,
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
        try {
          const qs = {
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

    return (
      <div className={baseClass}>
        <Label htmlFor={path} label={label} required={required} />
        <DateTimeInput
          path={path}
          value={value as Date | undefined}
          onChange={setValue}
          datePickerProps={datePickerProps}
          components={{}}
        />
        {scheduled && (
          <p style={{ color }}>
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
