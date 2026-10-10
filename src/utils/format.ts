import type { BugStatus } from '../api/types'

// Dates come from the API in UTC; the browser shows them in the user's own time zone and language
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

// The API's enum names are code, not text for people ("InProgress" → "In progress")
export const statusLabels: Record<BugStatus, string> = {
  Open: 'Open',
  InProgress: 'In progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
}
