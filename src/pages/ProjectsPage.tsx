import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router'
import { getProjects, projectKeys } from '../api/projects'
import type { ProjectDto } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { ProjectGlyph } from '../components/ProjectGlyph'
import { useAllBugCount } from '../hooks/useBugCount'
import { formatDate } from '../utils/format'
import { NewProjectPage } from './NewProjectPage'

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
    return <NewProjectPage firstRun />
  }

  // An overview of one project is just that project, so go straight to it.
  // replace: the Back button skips this redirect instead of bouncing back into it.
  if (projects.length === 1) {
    return <Navigate to={`/projects/${projects[0].id}`} replace />
  }

  return <StudioOverview projects={projects} />
}

function StudioOverview({ projects }: { projects: ProjectDto[] }) {
  // The projects already carry their counts, so these totals need no extra requests
  const totalBugs = projects.reduce((sum, project) => sum + project.bugCount, 0)
  const criticalCount = projects.reduce((sum, project) => sum + project.openCriticalCount, 0)
  // "Open" is a status, and the API can count that across every project (GET /api/bugs)
  const openBugs = useAllBugCount({ status: 'Open' })

  return (
    <>
      <section className="page-band overview-band" aria-label="Summary">
        <div className="band-eyebrow">studio overview</div>
        <h1 className="overview-headline">
          {projects.length} games in development.{' '}
          {criticalCount > 0 ? (
            <span className="headline-alert">
              <span className="mono">{criticalCount}</span> critical{' '}
              {criticalCount === 1 ? 'bug is' : 'bugs are'} still pending.
            </span>
          ) : (
            <span className="headline-calm">Nothing critical is pending.</span>
          )}
        </h1>
        <dl className="overview-stats">
          <Stat label="Games" value={projects.length} />
          <Stat label="Open bugs" value={openBugs} />
          <Stat label="Critical pending" value={criticalCount} tone="critical" />
          <Stat label="Bugs reported" value={totalBugs} />
        </dl>
      </section>

      <div className="project-rows">
        <div className="project-row project-row-head" aria-hidden="true">
          <span />
          <span>Game</span>
          <span className="col-description">Description</span>
          <span>Critical</span>
          <span>Bugs</span>
          <span className="col-created">Created</span>
        </div>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="project-row"
                data-critical={project.openCriticalCount > 0}
              >
                <ProjectGlyph projectId={project.id} size={28} />
                <span className="project-name">
                  {project.name} <span className="row-code">{project.code}</span>
                </span>
                <span className="col-description">{project.description}</span>
                <CriticalFlag count={project.openCriticalCount} />
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

// "■ 2 pending" in red when a project has critical bugs not finished yet, a quiet "none" when it doesn't
function CriticalFlag({ count }: { count: number }) {
  if (count === 0) {
    return <span className="critical-flag">none</span>
  }

  return (
    <span className="critical-flag" data-alert="true">
      <span className="critical-dot" aria-hidden="true" />
      {count} pending
    </span>
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
