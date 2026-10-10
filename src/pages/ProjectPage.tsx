import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { bugKeys, getProjectBugs } from '../api/bugs'
import { ApiError } from '../api/client'
import { getProject, projectKeys } from '../api/projects'
import type { BugListParams, ProjectDto } from '../api/types'
import { BugList } from '../components/BugList'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatDate } from '../utils/format'
import { projectCode } from '../utils/projectCode'

export function ProjectPage() {
  // The URL is /projects/:projectId, so the id arrives as text ("3") and is turned into a number
  const projectId = Number(useParams().projectId)
  const isValidId = Number.isInteger(projectId) && projectId > 0

  const { data: project, isPending, error } = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: isValidId, // don't call the API for URLs like /projects/abc
  })

  if (!isValidId || (error instanceof ApiError && error.status === 404)) {
    return <ProjectNotFound />
  }

  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  if (isPending) {
    return <p className="page-body muted">Loading project…</p>
  }

  return (
    <BugList
      projectId={project.id}
      projectName={project.name}
      header={<ProjectHeader project={project} />}
    />
  )
}

function ProjectHeader({ project }: { project: ProjectDto }) {
  return (
    <header className="band-header">
      <div className="band-eyebrow">
        {projectCode(project.name)} · created {formatDate(project.createdAt)}
      </div>
      <div className="band-title-row">
        <h1 className="band-title">{project.name}</h1>
        <BugStats projectId={project.id} total={project.bugCount} />
      </div>
      {project.description && <p className="band-description">{project.description}</p>}
    </header>
  )
}

// "3 open · 1 critical · 5 total". The API has no "counts" endpoint, so each number is a
// list request with pageSize 1: we only read its totalCount, not the bug that comes with it.
function BugStats({ projectId, total }: { projectId: number; total: number }) {
  const open = useBugCount(projectId, { status: 'Open' })
  const critical = useBugCount(projectId, { severity: 'Critical' })

  return (
    <span className="band-stats">
      <span className="stat-open">{open ?? '–'}</span> open ·{' '}
      <span className="stat-critical">{critical ?? '–'}</span> critical · {total} total
    </span>
  )
}

function useBugCount(projectId: number, filter: BugListParams) {
  const params = { ...filter, pageSize: 1 }
  const { data } = useQuery({
    queryKey: bugKeys.ofProject(projectId, params),
    queryFn: () => getProjectBugs(projectId, params),
  })
  return data?.totalCount
}

function ProjectNotFound() {
  return (
    <section className="page-body">
      <h2>Project not found</h2>
      <p className="muted">It may have been deleted, or the link is wrong.</p>
      <Link to="/">Back to all projects</Link>
    </section>
  )
}
