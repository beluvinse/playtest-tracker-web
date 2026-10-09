import { useQuery } from '@tanstack/react-query'
import { getProjects, projectKeys } from '../api/projects'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatDate } from '../utils/format'

export function ProjectsPage() {
  const { data: projects, isPending, error } = useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  })

  if (isPending) {
    return <p className="muted">Loading projects…</p>
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (projects.length === 0) {
    return <p className="muted">No projects yet.</p>
  }

  return (
    <section>
      <h2>Projects</h2>
      <ul className="card-list">
        {projects.map((project) => (
          <li key={project.id} className="card">
            <h3 className="card-title">{project.name}</h3>
            {project.description && <p className="card-text">{project.description}</p>}
            <p className="card-meta">
              <span className="badge">
                {project.bugCount} {project.bugCount === 1 ? 'bug' : 'bugs'}
              </span>
              <span>Created {formatDate(project.createdAt)}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
