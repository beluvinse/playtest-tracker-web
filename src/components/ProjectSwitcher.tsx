import { useRef } from 'react'
import { Link } from 'react-router'
import type { ProjectDto } from '../api/types'
import { useDismiss } from '../hooks/useDismiss'
import { projectCode } from '../utils/projectCode'
import { PixelIcon } from './PixelIcon'
import { ProjectGlyph } from './ProjectGlyph'

interface ProjectSwitcherProps {
  projects: ProjectDto[]
  current: ProjectDto | undefined // undefined = "All projects"
}

// The box at the top of the sidebar: shows the current project and opens a menu to switch.
// <details> gives open/close and keyboard support for free; useDismiss adds
// "close on click outside" and "close on Escape".
export function ProjectSwitcher({ projects, current }: ProjectSwitcherProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  useDismiss(detailsRef)

  // Picking an option navigates, so the menu should close too
  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  return (
    <details className="switcher" ref={detailsRef}>
      <summary className="switcher-current" title="Switch project">
        {current ? (
          <ProjectGlyph projectId={current.id} />
        ) : (
          <PixelIcon name="grid" size={20} className="switcher-grid" />
        )}
        <span className="switcher-text">
          <span className="switcher-name">{current ? current.name : 'All projects'}</span>
          <span className="switcher-meta">
            {current
              ? `${projectCode(current.name)} · ${bugCountText(current.bugCount)}`
              : `${projects.length} ${projects.length === 1 ? 'game' : 'games'}`}
          </span>
        </span>
        <PixelIcon name="chevronDown" size={8} className="switcher-chevron" />
      </summary>

      <div className="switcher-menu">
        <div className="eyebrow switcher-heading">Switch project</div>
        <Link
          to="/"
          className="switcher-option"
          aria-current={current ? undefined : 'true'}
          onClick={closeMenu}
        >
          <PixelIcon name="grid" size={16} className="switcher-grid" />
          <span>All projects</span>
          {!current && <PixelIcon name="check" size={10} className="switcher-check" />}
        </Link>
        <div className="scanline" aria-hidden="true" />
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="switcher-option"
            aria-current={project.id === current?.id ? 'true' : undefined}
            onClick={closeMenu}
          >
            <ProjectGlyph projectId={project.id} size={16} />
            <span className="switcher-text">
              <span>{project.name}</span>
              <span className="switcher-meta">{projectCode(project.name)}</span>
            </span>
            <span className="switcher-meta">{project.bugCount}</span>
          </Link>
        ))}
        <div className="switcher-divider" aria-hidden="true" />
        <Link to="/projects/new" className="switcher-option switcher-new" onClick={closeMenu}>
          <PixelIcon name="plus" size={12} />
          <span>New project</span>
        </Link>
      </div>
    </details>
  )
}

function bugCountText(count: number) {
  return `${count} ${count === 1 ? 'bug' : 'bugs'}`
}
