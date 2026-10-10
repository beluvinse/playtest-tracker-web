import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { bugKeys, getProjectBugs } from '../api/bugs'
import type { BugDto } from '../api/types'
import { toBugListParams, useBugFilters } from '../hooks/useBugFilters'
import { formatDate } from '../utils/format'
import { bugCode } from '../utils/projectCode'
import { SeverityMeter, StatusLabel } from './BugBadges'
import { BugFilterBar } from './BugFilterBar'
import { ErrorMessage } from './ErrorMessage'
import { Pagination } from './Pagination'

interface BugListProps {
  projectId: number
  projectName: string
  header: ReactNode // drawn on the same gridded band as the filters
}

export function BugList({ projectId, projectName, header }: BugListProps) {
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
      return <p className="list-message">Loading bugs…</p>
    }

    if (error) {
      return (
        <div className="list-message">
          <ErrorMessage error={error} />
        </div>
      )
    }

    if (data.items.length === 0) {
      // There are bugs, just not on this page (e.g. an old link to ?page=9)
      if (data.totalCount > 0) {
        return (
          <p className="list-message">
            This page is empty.{' '}
            <button type="button" className="link-button" onClick={() => setPage(1)}>
              Go to the first page
            </button>
          </p>
        )
      }

      if (hasFilters) {
        return (
          <p className="list-message">
            No bugs match these filters.{' '}
            <button type="button" className="link-button" onClick={clearFilters}>
              Clear filters
            </button>
          </p>
        )
      }

      return <p className="list-message">No bugs reported yet.</p>
    }

    return (
      <>
        <BugTable bugs={data.items} projectName={projectName} isUpdating={isPlaceholderData} />
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
      <div className="page-band">
        {header}
        <BugFilterBar
          filters={filters}
          onChange={setFilter}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />
      </div>
      {renderResults()}
    </>
  )
}

interface BugTableProps {
  bugs: BugDto[]
  projectName: string
  isUpdating: boolean
}

function BugTable({ bugs, projectName, isUpdating }: BugTableProps) {
  return (
    // On narrow screens the table scrolls sideways instead of stretching the page
    <div className="table-scroll" aria-busy={isUpdating}>
      <table className="bug-table">
        <thead>
          <tr>
            <th scope="col" className="col-id">Id</th>
            <th scope="col">Title</th>
            <th scope="col" className="col-severity">Severity</th>
            <th scope="col" className="col-status">Status</th>
            <th scope="col" className="col-date">Reported</th>
          </tr>
        </thead>
        <tbody>
          {bugs.map((bug) => (
            <tr key={bug.id}>
              <td className="bug-id">{bugCode(projectName, bug.id)}</td>
              <td className="bug-title">
                {/* The link covers the whole row (CSS), but it's still one link per bug */}
                <Link to={`/bugs/${bug.id}`}>{bug.title}</Link>
              </td>
              <td>
                <SeverityMeter severity={bug.severity} />
              </td>
              <td>
                <StatusLabel status={bug.status} />
              </td>
              <td className="bug-date">{formatDate(bug.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
