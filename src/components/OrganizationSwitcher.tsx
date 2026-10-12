import { useRef } from 'react'
import { Link } from 'react-router'
import type { OrganizationDto } from '../api/types'
import { useDismiss } from '../hooks/useDismiss'
import { PixelIcon } from './PixelIcon'

interface OrganizationSwitcherProps {
  organizations: OrganizationDto[] // the ones the person belongs to
  current: OrganizationDto | undefined // the one they are working in (unknown while it loads)
  isLoading: boolean
}

// The box at the top of the sidebar: shows the organization the person is working in and opens a
// menu to switch to another. It is the same kind of box as the project switcher right below it,
// and works the same way: <details> gives open/close and keyboard support for free.
export function OrganizationSwitcher({ organizations, current, isLoading }: OrganizationSwitcherProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  useDismiss(detailsRef)

  // Picking an option navigates, so the menu should close too
  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  // Nothing to choose from yet: keep the box in place so the sidebar doesn't jump when it loads
  if (isLoading) {
    return (
      <div className="switcher switcher-empty org-switcher" role="status">
        <span className="switcher-empty-box" aria-hidden="true" />
        <span className="switcher-text">
          <span className="switcher-name">Organizations…</span>
        </span>
      </div>
    )
  }

  return (
    <details className="switcher org-switcher" ref={detailsRef}>
      <summary className="switcher-current" title="Switch organization">
        <PixelIcon name="team" size={20} className="switcher-grid" />
        <span className="switcher-text">
          <span className="switcher-name">{current ? current.name : 'Choose organization'}</span>
          <span className="switcher-meta">
            {current ? describe(current) : `${organizations.length} ${plural(organizations.length, 'organization')}`}
          </span>
        </span>
        <PixelIcon name="chevronDown" size={8} className="switcher-chevron" />
      </summary>

      <div className="switcher-menu">
        <div className="eyebrow switcher-heading">Switch organization</div>
        {organizations.map((organization) => (
          <Link
            key={organization.id}
            to={`/organizations/${organization.id}`}
            className="switcher-option"
            aria-current={organization.id === current?.id ? 'true' : undefined}
            onClick={closeMenu}
          >
            <PixelIcon name="team" size={16} className="switcher-grid" />
            <span className="switcher-text">
              <span>
                {organization.name}
                {organization.isDemo && <span className="org-tag">example</span>}
              </span>
              <span className="switcher-meta">{describe(organization)}</span>
            </span>
            {organization.id === current?.id && (
              <PixelIcon name="check" size={10} className="switcher-check" />
            )}
          </Link>
        ))}
      </div>
    </details>
  )
}

// "owner · 3 projects": what the person is there, and how much is in it
function describe(organization: OrganizationDto) {
  const projects = `${organization.projectCount} ${plural(organization.projectCount, 'project')}`
  return `${organization.myRole.toLowerCase()} · ${projects}`
}

function plural(count: number, word: string) {
  return count === 1 ? word : `${word}s`
}
