'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import { formatDateTime } from '../../util.js'
import { text } from '../styles.js'
import Icon from '../Icon.js'

const AfterInputClient = ({ scheduledAt, path, currentFormValue, status }: { scheduledAt?: string, path: string, currentFormValue?: unknown, status: 'draft' | 'published' }) => {
  const { initialData } = useDocumentInfo()
  const initialFormValue = initialData?.[path]
  const currentPublishDate = currentFormValue ? new Date(currentFormValue as string) : null

  const isFuture = currentPublishDate && currentPublishDate > new Date()
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date() && status === 'draft'
  const isSchedulePending = currentPublishDate && currentPublishDate > new Date() && currentFormValue !== scheduledAt && currentFormValue !== initialFormValue
  const error = isFuture && !isSchedulePending && !isScheduled

  let color: string | undefined = undefined
  let message: string | undefined = undefined

  if (isScheduled) {
    color = 'var(--color-warning-650)'
    message = `Scheduled for ${formatDateTime(new Date(scheduledAt))}`
  }

  if (isSchedulePending) {
    color = 'var(--color-blue-650)'
    message = `Save to schedule for ${formatDateTime(currentPublishDate)}`
  }

  if (error) {
    color = 'var(--color-error-650)'
    message = `Error scheduling document`
  }

  const style = {
    ...text,
    color
  }

  return (
    <div>
      {isFuture && (
        <p style={style}>

          <Icon color={color} style={{ marginBottom: 0 }} />
          {message}
        </p>

      )}
    </div>
  )
}

export default AfterInputClient