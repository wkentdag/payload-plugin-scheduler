import { format, isToday, isTomorrow } from 'date-fns'

export function formatDateTime(inputDateTime: Date): string {
  if (isToday(inputDateTime)) {
    return format(inputDateTime, 'h:mm a')
  } else if (isTomorrow(inputDateTime)) {
    return `tomorrow, ${format(inputDateTime, 'h:mm a')}`
  } else {
    return format(inputDateTime, 'M/d/yy h:mm a')
  }
}
