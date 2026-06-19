import React from 'react'

import { formatDateTime } from '../util.js'
import Icon from './Icon.js'
import { text } from './styles.js'

export type ScheduledStatusMessageProps = {
  schedulePending?: boolean
  scheduledButNotQueued?: boolean
  status?: string
  value?: unknown
}

export const ScheduledStatusMessage: React.FC<ScheduledStatusMessageProps> = ({
  schedulePending = false,
  scheduledButNotQueued = false,
  status,
  value,
}) => {
  if (!value) {
    return null
  }

  const pubDate = value instanceof Date ? value : new Date(value as string)

  if (Number.isNaN(pubDate.getTime())) {
    return null
  }

  const scheduled = status === 'draft' && pubDate > new Date()

  if (!scheduled) {
    return null
  }

  let color = 'var(--color-warning-650)'

  if (schedulePending) {
    color = 'var(--color-blue-650)'
  }

  if (scheduledButNotQueued) {
    color = 'var(--color-error-650)'
  }

  const style = {
    ...text,
    color,
  }

  return (
    <p style={style}>
      <Icon color={color} />
      {scheduledButNotQueued ? (
        <>Scheduling error</>
      ) : (
        <>Scheduled for {formatDateTime(pubDate)}</>
      )}
    </p>
  )
}
