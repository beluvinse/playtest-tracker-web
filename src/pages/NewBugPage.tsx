import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { bugKeys, createBug } from '../api/bugs'
import { ApiError } from '../api/client'
import { getProject, projectKeys } from '../api/projects'
import type { CreateBugRequest, ProjectDto, Severity } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { FieldErrors } from '../components/FieldErrors'
import { SeverityPicker } from '../components/SeverityPicker'
import { projectCode } from '../utils/projectCode'

// Same limits as BugRequestDto in the API
const titleMinLength = 3
const titleMaxLength = 200
const descriptionMinLength = 10
const descriptionMaxLength = 4000

export function NewBugPage() {
  const projectId = Number(useParams().projectId)
  const isValidId = Number.isInteger(projectId) && projectId > 0

  // Same query (and cache) as the project page, so coming from there it's instant
  const { data: project, error } = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: isValidId,
  })

  if (!isValidId || (error instanceof ApiError && error.status === 404)) {
    return (
      <section className="page-body">
        <h2>Project not found</h2>
        <Link to="/">Back to all projects</Link>
      </section>
    )
  }

  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  if (!project) {
    return <p className="page-body muted">Loading project…</p>
  }

  return <BugForm project={project} />
}

function BugForm({ project }: { project: ProjectDto }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('Medium')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (bug: CreateBugRequest) => createBug(project.id, bug),
    onSuccess: (bug) => {
      // A new bug changes every bug list and count, and the project's bugCount.
      // Invalidating by prefix: ['bugs'] matches every key that starts with 'bugs'.
      queryClient.invalidateQueries({ queryKey: bugKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      navigate(`/bugs/${bug.id}`)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ title: title.trim(), description: description.trim(), severity })
  }

  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <section className="page-band report-bug">
      <div className="band-eyebrow">
        {projectCode(project.name)} · new bug report
      </div>
      <h1 className="band-title">Report a bug in {project.name}</h1>

      <form className="project-form bug-form" onSubmit={handleSubmit}>
        <label className="form-field">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={titleMinLength}
            maxLength={titleMaxLength}
            placeholder="Neon sign flickers too fast"
            aria-invalid={Boolean(fieldErrors.title)}
            autoFocus
          />
        </label>
        <FieldErrors messages={fieldErrors.title} />

        <label className="form-field">
          <span>
            What happened <span className="form-optional">steps, expected vs actual</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={descriptionMinLength}
            maxLength={descriptionMaxLength}
            rows={6}
            placeholder={'1. Start a new night\n2. Look at the neon sign\nExpected: slow pulse. Actual: fast flicker.'}
            aria-invalid={Boolean(fieldErrors.description)}
          />
        </label>
        <FieldErrors messages={fieldErrors.description} />

        <SeverityPicker value={severity} onChange={setSeverity} />
        <FieldErrors messages={fieldErrors.severity} />

        {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Reporting…' : 'Report bug'}
          </button>
          <Link to={`/projects/${project.id}`} className="form-cancel">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
