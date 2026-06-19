import type { DateFieldServerComponent } from 'payload'
import React from 'react'

import { ScheduledStatusMessage } from './ScheduledStatusMessage.js'

// afterInput is pre-rendered during form-state building, outside Payload admin
// providers. Payload UI hooks (useField, useConfig, etc.) cannot run here.
// For live in-form updates, use a custom Field component instead (see step 2).
const InputField: DateFieldServerComponent = ({ data, value }) => {
  return (
    <ScheduledStatusMessage
      status={data?._status as string | undefined}
      value={value ?? data?.publish_date}
    />
  )
}

export default InputField
