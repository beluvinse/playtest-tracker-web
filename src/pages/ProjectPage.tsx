import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getProject, projectKeys } from '../api/projects'
import type { ProjectDto } from '../api/types'
import { BugList } from '../components/BugList'
import { DeleteProjectButton } from '../components/DeleteProjectButton'
import { ErrorMessage } from '../components/ErrorMessage'
import { PixelIcon } from '../components/PixelIcon'
import { ProjectEditForm } from '../components/ProjectEditForm'
import { openCritical, useProjectBugCount } from '../hooks/useBugCount'
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
  // Reading or editing, like on the bug page
  const [isEditing, setIsEditing] = useState(false)

  return (
    <header className="band-header">
      <div className="band-eyebrow">
        {projectCode(project.name)} · created {formatDate(project.createdAt)}
      </div>
      {isEditing ? (
        <ProjectEditForm project={project} onDone={() => setIsEditing(false)} />
      ) : (
        <>
          <div className="band-title-row">
            <h1 className="band-title">{project.name}</h1>
            <BugStats projectId={project.id} total={project.bugCount} />
            <div className="project-actions">
              <button type="button" className="button-ghost" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <DeleteProjectButton project={project} />
              <Link
                to={`/projects/${project.id}/bugs/new`}
                className="button-primary button-small"
              >
                <PixelIcon name="plus" size={10} />
                Report bug
              </Link>
            </div>
          </div>
          {project.description && <p className="band-description">{project.description}</p>}
        </>
      )}
    </header>
  )
}

// "3 open · 1 critical · 5 total" (critical = critical and still open)
function BugStats({ projectId, total }: { projectId: number; total: number }) {
  const open = useProjectBugCount(projectId, { status: 'Open' })
  const critical = useProjectBugCount(projectId, openCritical)

  return (
    <span className="band-stats">
      <span className="stat-open">{open ?? '–'}</span> open ·{' '}
      {/* Red only when there is something to worry about */}
      <span className="stat-critical" data-alert={critical !== undefined && critical > 0}>
        {critical ?? '–'}
      </span>{' '}
      critical · {total} total
    </span>
  )
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
