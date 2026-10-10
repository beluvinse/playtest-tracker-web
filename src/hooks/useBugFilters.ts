import { useSearchParams } from 'react-router'
import { bugStatuses, severities } from '../api/types'
import type { BugListParams, BugSortField, BugStatus, Severity } from '../api/types'

// Each choice in the "Sort" menu, turned into the sortBy + descending pair the API expects.
// The URL only stores the short key (?sort=severity), which is easier to read and share.
export const sortOptions = {
  newest: { label: 'Newest first', sortBy: 'createdAt', descending: true },
  oldest: { label: 'Oldest first', sortBy: 'createdAt', descending: false },
  severity: { label: 'Most severe first', sortBy: 'severity', descending: true },
  status: { label: 'By status', sortBy: 'status', descending: false },
} satisfies Record<string, { label: string; sortBy: BugSortField; descending: boolean }>

export type SortKey = keyof typeof sortOptions

const sortKeys = Object.keys(sortOptions) as SortKey[]
const defaultSort: SortKey = 'newest'

// Bugs per page. The API accepts 1 to 50.
export const pageSize = 10

export interface BugFilters {
  status?: BugStatus
  severity?: Severity
  search?: string
  sort: SortKey
  page: number
}

// The filters the user picks in the filter bar (the page has its own controls)
export type FilterName = Exclude<keyof BugFilters, 'page'>

// Reads the bug list filters from the URL's query string and writes them back to it,
// so a filtered view survives a reload and can be shared as a link
export function useBugFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Anything typed by hand in the URL that isn't a valid option is ignored
  // (?status=Banana shows every status), so the API never receives a bad value
  const filters: BugFilters = {
    status: pick(searchParams.get('status'), bugStatuses),
    severity: pick(searchParams.get('severity'), severities),
    search: searchParams.get('search')?.trim() || undefined,
    sort: pick(searchParams.get('sort'), sortKeys) ?? defaultSort,
    page: toPageNumber(searchParams.get('page')),
  }

  function setFilter(name: FilterName, value: string | undefined) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      // Empty values and the default sort are left out, so the URL only shows real choices
      if (!value || (name === 'sort' && value === defaultSort)) {
        next.delete(name)
      } else {
        next.set(name, value)
      }
      // A different filter means different results: start again from page 1
      next.delete('page')
      return next
    })
  }

  function setPage(page: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (page <= 1) {
        next.delete('page')
      } else {
        next.set('page', String(page))
      }
      return next
    })
  }

  function clearFilters() {
    setSearchParams({})
  }

  const hasFilters = Boolean(filters.status || filters.severity || filters.search)

  return { filters, setFilter, setPage, clearFilters, hasFilters }
}

// Turns the filters into the query string GET /api/projects/{id}/bugs understands
export function toBugListParams(filters: BugFilters): BugListParams {
  const { sortBy, descending } = sortOptions[filters.sort]
  return {
    status: filters.status,
    severity: filters.severity,
    search: filters.search,
    sortBy,
    descending,
    page: filters.page,
    pageSize,
  }
}

// ?page=3 → 3. Missing or invalid values (?page=abc, ?page=-1) mean page 1.
function toPageNumber(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

// Returns the value only if it is one of the allowed options
function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((option) => option === value)
}
