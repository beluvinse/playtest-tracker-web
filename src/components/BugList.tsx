import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { MouseEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
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
  projectCode: string
  header: ReactNode // drawn on the same gridded band as the filters
}

export function BugList({ projectId, projectCode, header }: BugListProps) {
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
        <BugTable bugs={data.items} projectCode={projectCode} isUpdating={isPlaceholderData} />
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
  projectCode: string
  isUpdating: boolean
}

function BugTable({ bugs, projectCode, isUpdating }: BugTableProps) {
  const navigate = useNavigate()

  // Clicking anywhere on a row opens the bug (the title is still a real link, for the keyboard,
  // for "open in a new tab" and for screen readers)
  function openBug(event: MouseEvent<HTMLTableRowElement>, bugId: number) {
    if ((event.target as HTMLElement).closest('a')) return // the link does it itself
    if (window.getSelection()?.toString()) return // somebody is selecting text to copy it
    navigate(`/bugs/${bugId}`)
  }

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
            <tr key={bug.id} onClick={(event) => openBug(event, bug.id)}>
              <td className="bug-id">{bugCode(projectCode, bug.id)}</td>
              <td className="bug-title">
                {/* One real link per bug; clicks on the rest of the row are handled by the row */}
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
