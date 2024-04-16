import React, { useEffect, useState } from 'react'

// this is how we'll interface with Payload itself
import { useFieldType, DateTimeInput, useFormFields, useForm } from 'payload/components/forms';

// we'll re-use the built in Label component directly from Payload
import { Label } from 'payload/components/forms';

// we can use existing Payload types easily
import { Props } from 'payload/components/fields/Text';

// we'll import and reuse our existing validator function on the frontend, too
// import { validateHexColor } from './config';

// Import the SCSS stylesheet
import './styles.scss';
import { ConditionalDateProps } from 'payload/dist/admin/components/elements/DatePicker/types';
import { formatDateTime } from './util';
import Icon from './Icon';
import { useDocumentInfo } from 'payload/dist/admin/components/utilities/DocumentInfo';

const baseClass = 'scheduler-publish-at';

// https://payloadcms.com/blog/building-a-custom-field
const InputField: (datePickerProps: ConditionalDateProps) => React.FC<Props> = (datePickerProps) => (props) => {
  const {
    label,
    required
  } = props;

  const path = props.path!

  const {
    value = undefined,
    initialValue,
    setValue,
  } = useFieldType({
    path,
    // validate: validateHexColor,
  });

  // db returns string, updates from date-picker return Date
  const pubDate = value && typeof value === 'object' ? value as Date : new Date(value as string)

  const status = useFormFields(([fields]) => fields._status)
  const scheduled = value && status.value === 'draft' && pubDate > new Date()
  const schedulePending = value !== initialValue

  // verify that scheduled posts actually have a job
  const doc = useDocumentInfo()
  const [queued, setQueued] = useState<boolean>()
  useEffect(() => {
    async function verifySchedule() {
      const req = await fetch(`/api/scheduled_posts?where[or][0][and][0][post][equals][relationTo]=${doc.collection?.slug}&where[or][0][and][0][post][equals][value]=${doc.id}`)
      const schedules = await req.json()
      if (schedules.docs[0]) {
        setQueued(schedules.docs[0].date === initialValue)
      }
    }

    if (scheduled) {
      try {
        verifySchedule()
      } catch (error) {
        setQueued(false)
      }
    }
  }, [doc])

  // https://payloadcms.com/docs/admin/customizing-css#overriding-built-in-styles
  let color = 'var(--color-warning-650)'
  const pendingColor = 'var(--color-blue-650)'

  if (schedulePending) {
    color = pendingColor
  }

  // if `publish_date` is in the future but there's no queued job, something's gone wrong
  const scheduledButNotQueued = !schedulePending && scheduled && queued === false
  if (scheduledButNotQueued) {
    color = 'var(--color-error-650)'
  }

  return (
    <div className={baseClass}>
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <DateTimeInput
        path={path}
        value={value as Date | undefined}
        onChange={setValue}
        datePickerProps={datePickerProps}
      />
      {
        scheduled &&
        <p style={{ color }}>
          <Icon color={color} />
          {
            scheduledButNotQueued ? (
              <>
                Scheduling error
              </>
            ) : (
              <>
                Scheduled for {formatDateTime(pubDate)}
                </>
              )
            }
        </p>
      }
    </div>
  )
};

export default InputField;