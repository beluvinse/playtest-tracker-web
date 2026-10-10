import { useQuery } from '@tanstack/react-query'
import { bugKeys, getProjectBugs } from '../api/bugs'
import type { BugStatus, Severity } from '../api/types'
import { formatDate, statusLabels } from '../utils/format'
import { ErrorMessage } from './ErrorMessage'

interface BugListProps {
  projectId: number
}

export function BugList({ projectId }: BugListProps) {
  const { data, isPending, error } = useQuery({
    queryKey: bugKeys.ofProject(projectId, {}),
    queryFn: () => getProjectBugs(projectId),
  })

  if (isPending) {
    return <p className="muted">Loading bugs…</p>
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (data.items.length === 0) {
    return <p className="muted">No bugs reported yet.</p>
  }

  return (
    // On narrow screens the table scrolls sideways instead of stretching the page
    <div className="table-scroll">
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
          {data.items.map((bug) => (
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
