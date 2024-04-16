import { format, isToday, isTomorrow } from 'date-fns'

export function formatDateTime(inputDateTime: Date, lowerCase = true): string {
  const firstChar = lowerCase ? 't' : 'T'
  if (isToday(inputDateTime)) {
    return `${firstChar}oday, ${format(inputDateTime, 'h:mm a')}`
  }
  if (isTomorrow(inputDateTime)) {
    return `${firstChar}omorrow, ${format(inputDateTime, 'h:mm a')}`
  }
  return format(inputDateTime, 'M/d/yy h:mm a')
}
