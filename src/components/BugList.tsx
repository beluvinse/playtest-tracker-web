import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { bugKeys, getProjectBugs } from '../api/bugs'
import type { BugDto, BugStatus, Severity } from '../api/types'
import { toBugListParams, useBugFilters } from '../hooks/useBugFilters'
import { formatDate, statusLabels } from '../utils/format'
import { BugFilterBar } from './BugFilterBar'
import { ErrorMessage } from './ErrorMessage'
import { Pagination } from './Pagination'

interface BugListProps {
  projectId: number
}

export function BugList({ projectId }: BugListProps) {
  const { filters, setFilter, setPage, clearFilters, hasFilters } = useBugFilters()
  const params = toBugListParams(filters)

  const { data, isPending, isPlaceholderData, error } = useQuery({
    // The filters and page are part of the key, so each combination is cached separately
    queryKey: bugKeys.ofProject(projectId, params),
    queryFn: () => getProjectBugs(projectId, params),
    // While a new filter or page loads, keep showing the previous results instead of "Loading…"
    placeholderData: keepPreviousData,
  })

  function renderResults() {
    if (isPending) {
      return <p className="muted">Loading bugs…</p>
    }

    if (error) {
      return <ErrorMessage error={error} />
    }

    if (data.items.length === 0) {
      // There are bugs, just not on this page (e.g. an old link to ?page=9)
      if (data.totalCount > 0) {
        return (
          <p className="muted">
            This page is empty.{' '}
            <button type="button" className="link-button" onClick={() => setPage(1)}>
              Go to the first page
            </button>
          </p>
        )
      }

      if (hasFilters) {
        return (
          <p className="muted">
            No bugs match these filters.{' '}
            <button type="button" className="link-button" onClick={clearFilters}>
              Clear filters
            </button>
          </p>
        )
      }

      return <p className="muted">No bugs reported yet.</p>
    }

    return (
      <>
        <BugTable bugs={data.items} isUpdating={isPlaceholderData} />
        {/* page and pageSize come from the API's answer, the source of truth */}
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          onPageChange={setPage}
        />
      </>
    )
  }

  return (
    <>
      <BugFilterBar filters={filters} onChange={setFilter} />
      {renderResults()}
    </>
  )
}

interface BugTableProps {
  bugs: BugDto[]
  isUpdating: boolean
}

function BugTable({ bugs, isUpdating }: BugTableProps) {
  return (
    // On narrow screens the table scrolls sideways instead of stretching the page
    <div className="table-scroll" aria-busy={isUpdating}>
      <table className="bug-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Severity</th>
            <th scope="col">Status</th>
            <th scope="col">Reported</th>
          </tr>
        </thead>
        <tbody>
          {bugs.map((bug) => (
            <tr key={bug.id}>
              <td className="bug-id">#{bug.id}</td>
              <td>{bug.title}</td>
              <td>
                <SeverityBadge severity={bug.severity} />
              </td>
              <td>
                <StatusBadge status={bug.status} />
              </td>
              <td className="muted">{formatDate(bug.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// The color comes from CSS, chosen by the data-severity / data-status attribute
function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className="tag" data-severity={severity}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }: { status: BugStatus }) {
  return (
    <span className="tag" data-status={status}>
      {statusLabels[status]}
    </span>
  )
}
