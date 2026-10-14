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
import { useProjectBugCount } from '../hooks/useBugCount'
import { useOrganizationRole } from '../hooks/useOrganizationRole'
import { formatDate } from '../utils/format'

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
      projectCode={project.code}
      header={<ProjectHeader project={project} />}
    />
  )
}

function ProjectHeader({ project }: { project: ProjectDto }) {
  // Reading or editing, like on the bug page
  const [isEditing, setIsEditing] = useState(false)

  // What the person is in the organization this project belongs to
  const role = useOrganizationRole(project.organizationId)

  return (
    <header className="band-header">
      <div className="band-eyebrow">
        {project.code} · created {formatDate(project.createdAt)}
      </div>
      {isEditing ? (
        <ProjectEditForm project={project} onDone={() => setIsEditing(false)} />
      ) : (
        <>
          <div className="band-title-row">
            <h1 className="band-title">{project.name}</h1>
            <BugStats project={project} />
            <div className="project-actions">
              <button type="button" className="button-ghost" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              {/* Only the Owner of the organization can delete one of its projects: a Member
                  would only get a 403, so the button isn't offered */}
              {role === 'Owner' && <DeleteProjectButton project={project} />}
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

// "3 open · 1 critical · 5 total". The critical count comes with the project (a critical bug
// that is not resolved yet); the open count still needs its own small request.
function BugStats({ project }: { project: ProjectDto }) {
  const open = useProjectBugCount(project.id, { status: 'Open' })
  const critical = project.openCriticalCount

  return (
    <span className="band-stats">
      <span className="stat-open">{open ?? '–'}</span> open ·{' '}
      {/* Red only when there is something to worry about */}
      <span className="stat-critical" data-alert={critical > 0}>
        {critical}
      </span>{' '}
      critical · {project.bugCount} total
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
