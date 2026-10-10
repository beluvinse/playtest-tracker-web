import type { BugStatus } from '../api/types'

// Dates come from the API in UTC; the browser shows them in the user's own time zone and language
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

// "8 Oct 2026, 21:14": for a single bug, where the time matters too
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate))
}

// The API's enum names are code, not text for people ("InProgress" → "In progress")
export const statusLabels: Record<BugStatus, string> = {
  Open: 'Open',
  InProgress: 'In progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
}
