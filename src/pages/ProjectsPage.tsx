import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router'
import { bugKeys, searchBugs } from '../api/bugs'
import { getProjects, projectKeys } from '../api/projects'
import type { BugListParams, ProjectDto } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { ProjectGlyph } from '../components/ProjectGlyph'
import { formatDate } from '../utils/format'
import { projectCode } from '../utils/projectCode'

export function ProjectsPage() {
  const { data: projects, isPending, error } = useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  })

  if (isPending) {
    return <p className="page-body muted">Loading projects…</p>
  }

  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  if (projects.length === 0) {
    return <p className="page-body muted">No projects yet.</p>
  }

  // An overview of one project is just that project, so go straight to it.
  // replace: the Back button skips this redirect instead of bouncing back into it.
  if (projects.length === 1) {
    return <Navigate to={`/projects/${projects[0].id}`} replace />
  }

  return <StudioOverview projects={projects} />
}

function StudioOverview({ projects }: { projects: ProjectDto[] }) {
  const totalBugs = projects.reduce((sum, project) => sum + project.bugCount, 0)
  // Across every project (GET /api/bugs). Same trick as the project page: pageSize 1, read totalCount.
  const openBugs = useBugCount({ status: 'Open' })
  const openCritical = useBugCount({ status: 'Open', severity: 'Critical' })

  return (
    <>
      <section className="page-band overview-band" aria-label="Summary">
        <div className="band-eyebrow">studio overview</div>
        <h1 className="overview-headline">
          {projects.length} games in development.{' '}
          {openCritical === undefined ? null : openCritical > 0 ? (
            <span className="headline-alert">
              <span className="mono">{openCritical}</span> critical{' '}
              {openCritical === 1 ? 'bug is' : 'bugs are'} still open.
            </span>
          ) : (
            <span className="headline-calm">Nothing critical is open.</span>
          )}
        </h1>
        <dl className="overview-stats">
          <Stat label="Games" value={projects.length} />
          <Stat label="Open bugs" value={openBugs} />
          <Stat label="Open critical" value={openCritical} tone="critical" />
          <Stat label="Bugs reported" value={totalBugs} />
        </dl>
      </section>

      <div className="project-rows">
        <div className="project-row project-row-head" aria-hidden="true">
          <span />
          <span>Game</span>
          <span className="col-description">Description</span>
          <span>Bugs</span>
          <span className="col-created">Created</span>
        </div>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`} className="project-row">
                <ProjectGlyph projectId={project.id} size={28} />
                <span className="project-name">
                  {project.name} <span className="row-code">{projectCode(project.name)}</span>
                </span>
                <span className="col-description">{project.description}</span>
                <span className="mono">{project.bugCount}</span>
                <span className="col-created mono">{formatDate(project.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

interface StatProps {
  label: string
  value: number | undefined // undefined while it loads
  tone?: 'critical'
}

function Stat({ label, value, tone }: StatProps) {
  const isAlert = tone === 'critical' && value !== undefined && value > 0
  return (
    <div className="stat" data-alert={isAlert}>
      <dt>{label}</dt>
      <dd>{value ?? '–'}</dd>
    </div>
  )
}

function useBugCount(filter: BugListParams) {
  const params = { ...filter, pageSize: 1 }
  const { data } = useQuery({
    queryKey: bugKeys.search(params),
    queryFn: () => searchBugs(params),
  })
  return data?.totalCount
}
