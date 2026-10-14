import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router'
import { bugKeys, getBug } from '../api/bugs'
import { getOrganizations, organizationKeys } from '../api/organizations'
import { getOrganizationProjects, getProject, projectKeys } from '../api/projects'
import { getLastOrganizationId, setLastOrganizationId } from '../organizations/lastOrganization'
import { resolveOrganizationId } from '../organizations/pickOrganization'
import { bugCode } from '../utils/projectCode'
import { OrganizationSwitcher } from './OrganizationSwitcher'
import { PixelIcon } from './PixelIcon'
import { ProjectSwitcher } from './ProjectSwitcher'
import { UserMenu } from './UserMenu'

// A number from an address segment, or undefined if it isn't a valid id ("abc", "0", "-3")
function toId(text: string | undefined): number | undefined {
  const id = Number(text)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

// The frame around every page: sidebar on the left, top bar, and the page itself
export function AppShell({ children }: { children: ReactNode }) {
  // The shell sits outside <Routes>, so it can't use useParams; useMatch reads the URL directly.
  // "/*" also matches deeper pages, like /projects/5/bugs/new.
  const organizationMatch = useMatch('/organizations/:organizationId/*')
  const projectMatch = useMatch('/projects/:projectId/*')
  const bugMatch = useMatch('/bugs/:bugId')
  const bugId = Number(bugMatch?.params.bugId)

  // On a bug's page the project comes from the bug. Same key as BugPage, so no extra request.
  const bugQuery = useQuery({
    queryKey: bugKeys.detail(bugId),
    queryFn: () => getBug(bugId),
    enabled: Number.isInteger(bugId) && bugId > 0,
  })
  const currentBug = bugMatch ? bugQuery.data : undefined
  const projectId = toId(currentBug ? String(currentBug.projectId) : projectMatch?.params.projectId)

  // The project says which organization it belongs to. Same key as ProjectPage: one request.
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? 0),
    queryFn: () => getProject(projectId!),
    enabled: projectId !== undefined,
  })

  // The organizations of the person. It also tells whether the API is answering (see ApiStatus).
  const organizationsQuery = useQuery({ queryKey: organizationKeys.all, queryFn: getOrganizations })
  const organizations = organizationsQuery.data ?? []

  // Which organization we are "in": see resolveOrganizationId
  const organizationId = resolveOrganizationId({
    fromAddress: toId(organizationMatch?.params.organizationId),
    insideAProject: projectMatch !== null || bugMatch !== null,
    ofTheProject: projectQuery.data?.organizationId,
    lastUsed: getLastOrganizationId(),
  })

  const currentOrganization = organizations.find((organization) => organization.id === organizationId)

  // Remember it, so the app opens there next time. Only if it really is one of theirs: an
  // address like /organizations/999 must not become "the last one".
  const isMine = organizations.some((organization) => organization.id === organizationId)
  useEffect(() => {
    if (organizationId !== undefined && isMine) setLastOrganizationId(organizationId)
  }, [organizationId, isMine])

  // The projects of that organization. Same key as the overview page, so both share one request.
  const projectsQuery = useQuery({
    queryKey: projectKeys.ofOrganization(organizationId ?? 0),
    queryFn: () => getOrganizationProjects(organizationId!),
    enabled: organizationId !== undefined,
  })
  const projects = projectsQuery.data ?? []
  const currentProject = projects.find((project) => project.id === projectId)

  // Last part of the breadcrumb inside a project: "bugs", "report bug" or the bug's code
  const isNewBug = useMatch('/projects/:projectId/bugs/new') !== null
  const crumbTail =
    currentBug && currentProject
      ? bugCode(currentProject.code, currentBug.id)
      : isNewBug
        ? 'report bug'
        : 'bugs'

  // What the breadcrumb shows when no project is selected
  const isMembers = useMatch('/organizations/:organizationId/members') !== null
  const isNewOrganization = useMatch('/organizations/new') !== null
  const isNewProject =
    useMatch('/organizations/:organizationId/projects/new') !== null ||
    (projectsQuery.isSuccess && projects.length === 0)
  const pageLabel = isNewOrganization
    ? 'new organization'
    : isMembers
    ? 'people'
    : isNewProject
      ? 'new project'
      : projectMatch
        ? 'project'
        : 'all projects'

  // Where "Overview" leads: the organization we are in (or "/", which finds one)
  const overviewPath = organizationId === undefined ? '/' : `/organizations/${organizationId}`

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="wordmark">
          <PixelIcon name="bug" size={18} className="wordmark-icon" />
          <span className="wordmark-text">Playtest</span>
          <span className="wordmark-tag">qa</span>
        </Link>

        {/* Which organization we are in. The project switcher below shows ITS projects. */}
        <OrganizationSwitcher
          organizations={organizations}
          current={currentOrganization}
          isLoading={organizationsQuery.isPending}
        />

        {/* With no projects there is nothing to switch to: show a placeholder instead */}
        {projectsQuery.isSuccess && projects.length === 0 ? (
          <div className="switcher-empty">
            <span className="switcher-empty-box" aria-hidden="true" />
            <span className="switcher-text">
              <span className="switcher-name">No project yet</span>
              <span className="switcher-meta">create one to begin</span>
            </span>
          </div>
        ) : (
          <ProjectSwitcher
            projects={projects}
            current={currentProject}
            organizationId={organizationId}
          />
        )}

        <nav className="sidebar-nav" aria-label="Main">
          {/* end: the overview is only active on its own page, not on every page that starts with it */}
          <NavLink to={overviewPath} end className="nav-item">
            <PixelIcon name="grid" />
            Overview
          </NavLink>
          {currentProject && (
            <NavLink to={`/projects/${currentProject.id}`} className="nav-item">
              <PixelIcon name="bug" />
              Bugs
              <span className="nav-count">{currentProject.bugCount}</span>
            </NavLink>
          )}
          {/* The people of the organization we are in (only when it is one of theirs) */}
          {currentOrganization && (
            <NavLink to={`/organizations/${currentOrganization.id}/members`} className="nav-item">
              <PixelIcon name="team" />
              People
              <span className="nav-count">{currentOrganization.memberCount}</span>
            </NavLink>
          )}
        </nav>

        <ApiStatus
          isOnline={organizationsQuery.isSuccess}
          isChecking={organizationsQuery.isPending}
        />
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <nav aria-label="Location" className="breadcrumb">
            {currentProject ? (
              <>
                <Link to={overviewPath}>studio</Link>
                <span className="breadcrumb-sep">/</span>
                {/* A link back to the project, except on the project page itself */}
                {currentBug || isNewBug ? (
                  <Link to={`/projects/${currentProject.id}`}>{toSlug(currentProject.name)}</Link>
                ) : (
                  <span>{toSlug(currentProject.name)}</span>
                )}
                <span className="breadcrumb-sep">/</span>
                <span aria-current="page">{crumbTail}</span>
              </>
            ) : (
              <>
                studio<span className="breadcrumb-sep">/</span>
                <span aria-current="page">{pageLabel}</span>
              </>
            )}
          </nav>
          <UserMenu />
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  )
}

// Bottom of the sidebar: whether the last request to the API worked, and where it lives
function ApiStatus({ isOnline, isChecking }: { isOnline: boolean; isChecking: boolean }) {
  const state = isChecking ? 'checking' : isOnline ? 'online' : 'offline'
  return (
    <div className="api-status" data-state={state}>
      <span>
        <span className="api-dot" aria-hidden="true" />
        api {state}
      </span>
      <span>{new URL(import.meta.env.VITE_API_URL).host}</span>
    </div>
  )
}

// "Pink in the Night" → "pink-in-the-night", like the design's breadcrumb
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
