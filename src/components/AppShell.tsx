import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router'
import { getProjects, projectKeys } from '../api/projects'
import { PixelIcon } from './PixelIcon'
import { ProjectSwitcher } from './ProjectSwitcher'

// The frame around every page: sidebar on the left, top bar, and the page itself
export function AppShell({ children }: { children: ReactNode }) {
  // The shell sits outside <Routes>, so it can't use useParams; useMatch reads the URL directly
  const projectMatch = useMatch('/projects/:projectId')
  const projectId = Number(projectMatch?.params.projectId)

  // Same key as the projects page, so both share one request and one cache entry
  const projectsQuery = useQuery({ queryKey: projectKeys.all, queryFn: getProjects })
  const projects = projectsQuery.data ?? []
  const currentProject = projects.find((project) => project.id === projectId)

  // What the breadcrumb shows when no project is selected
  const isNewProject =
    useMatch('/projects/new') !== null || (projectsQuery.isSuccess && projects.length === 0)
  const pageLabel = isNewProject ? 'new project' : projectMatch ? 'project' : 'all projects'

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="wordmark">
          <PixelIcon name="bug" size={18} className="wordmark-icon" />
          <span className="wordmark-text">Playtest</span>
          <span className="wordmark-tag">qa</span>
        </Link>

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
          <ProjectSwitcher projects={projects} current={currentProject} />
        )}

        <nav className="sidebar-nav" aria-label="Main">
          {/* end: "/" is only active on the home page, not on every page that starts with "/" */}
          <NavLink to="/" end className="nav-item">
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
        </nav>

        <ApiStatus isOnline={projectsQuery.isSuccess} isChecking={projectsQuery.isPending} />
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <nav aria-label="Location" className="breadcrumb">
            {currentProject ? (
              <>
                <Link to="/">studio</Link>
                <span className="breadcrumb-sep">/</span>
                <span>{toSlug(currentProject.name)}</span>
                <span className="breadcrumb-sep">/</span>
                <span aria-current="page">bugs</span>
              </>
            ) : (
              <>
                studio<span className="breadcrumb-sep">/</span>
                <span aria-current="page">{pageLabel}</span>
              </>
            )}
          </nav>
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
