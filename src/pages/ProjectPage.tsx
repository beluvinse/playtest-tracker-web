import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getProject, projectKeys } from '../api/projects'
import { BugList } from '../components/BugList'
import { ErrorMessage } from '../components/ErrorMessage'
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
    return <ErrorMessage error={error} />
  }

  if (isPending) {
    return <p className="muted">Loading project…</p>
  }

  return (
    <section>
      <Link to="/" className="back-link">
        ← All projects
      </Link>
      <h2>{project.name}</h2>
      {project.description && <p className="muted">{project.description}</p>}
      <p className="card-meta">
        <span className="badge">
          {project.bugCount} {project.bugCount === 1 ? 'bug' : 'bugs'}
        </span>
        <span>Created {formatDate(project.createdAt)}</span>
      </p>

      <h3 className="section-title">Bugs</h3>
      <BugList projectId={project.id} />
    </section>
  )
}

function ProjectNotFound() {
  return (
    <section>
      <h2>Project not found</h2>
      <p className="muted">It may have been deleted, or the link is wrong.</p>
      <Link to="/">Back to all projects</Link>
    </section>
  )
}
