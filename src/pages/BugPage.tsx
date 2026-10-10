import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { bugKeys, getBug } from '../api/bugs'
import { ApiError } from '../api/client'
import { getProject, projectKeys } from '../api/projects'
import type { BugDto, ProjectDto } from '../api/types'
import { SeverityMeter } from '../components/BugBadges'
import { BugEditForm } from '../components/BugEditForm'
import { BugStatusControls } from '../components/BugStatusControls'
import { DeleteBugButton } from '../components/DeleteBugButton'
import { ErrorMessage } from '../components/ErrorMessage'
import { ProjectGlyph } from '../components/ProjectGlyph'
import { formatDateTime } from '../utils/format'
import { bugCode } from '../utils/projectCode'

export function BugPage() {
  // Same pattern as ProjectPage: the id comes from the URL as text
  const bugId = Number(useParams().bugId)
  const isValidId = Number.isInteger(bugId) && bugId > 0

  const bugQuery = useQuery({
    queryKey: bugKeys.detail(bugId),
    queryFn: () => getBug(bugId),
    enabled: isValidId,
  })

  // The bug only has a projectId; the name (for "PIN-006" and the link) comes from the project.
  // This query waits for the bug: "enabled" stays false until we know which project to ask for.
  const projectId = bugQuery.data?.projectId
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? 0),
    queryFn: () => getProject(projectId!),
    enabled: projectId !== undefined,
  })

  if (!isValidId || (bugQuery.error instanceof ApiError && bugQuery.error.status === 404)) {
    return <BugNotFound />
  }

  const error = bugQuery.error ?? projectQuery.error
  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  if (!bugQuery.data || !projectQuery.data) {
    return <p className="page-body muted">Loading bug…</p>
  }

  return <BugReport bug={bugQuery.data} project={projectQuery.data} />
}

function BugReport({ bug, project }: { bug: BugDto; project: ProjectDto }) {
  // Reading or editing. Local state: it only matters to this page, so no URL or cache needed.
  const [isEditing, setIsEditing] = useState(false)
  const code = bugCode(project.code, bug.id)

  return (
    <article className="bug-report">
      <header className="page-band bug-header">
        <div className="bug-meta">
          <span className="bug-meta-code">{code}</span>
          <span>reported {formatDateTime(bug.createdAt)}</span>
        </div>
        {!isEditing && <h1 className="bug-heading">{bug.title}</h1>}
        <div className="bug-facts">
          <BugStatusControls bug={bug} />
          <SeverityMeter severity={bug.severity} />
          <Link to={`/projects/${project.id}`} className="bug-project">
            <ProjectGlyph projectId={project.id} size={12} />
            {project.name}
          </Link>
          {!isEditing && (
            <div className="bug-actions">
              <button type="button" className="button-ghost" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <DeleteBugButton bugId={bug.id} bugCode={code} projectId={project.id} />
            </div>
          )}
        </div>
      </header>

      <div className="bug-sections">
        {isEditing ? (
          <section className="bug-section">
            <h2 className="bug-section-title">
              <span>00</span> Editing
            </h2>
            <BugEditForm bug={bug} onDone={() => setIsEditing(false)} />
          </section>
        ) : (
          <section className="bug-section">
            <h2 className="bug-section-title">
              <span>01</span> Description
            </h2>
            {/* pre-line keeps the line breaks the tester typed */}
            <p className="bug-description">{bug.description}</p>
          </section>
        )}
      </div>
    </article>
  )
}

function BugNotFound() {
  return (
    <section className="page-body">
      <h2>Bug not found</h2>
      <p className="muted">It may have been deleted, or the link is wrong.</p>
      <Link to="/">Back to all projects</Link>
    </section>
  )
}
