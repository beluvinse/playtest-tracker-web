import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { OrganizationDto } from '../api/types'
import { organization } from '../test/fakeApi'
import { OrganizationSwitcher } from './OrganizationSwitcher'

const personal = organization({ id: 1, name: "Ana's space", myRole: 'Owner', projectCount: 1, memberCount: 1 })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member', projectCount: 3, memberCount: 4 })
const demo = organization({ id: 3, name: 'Pink in the Night Studio', myRole: 'Member', projectCount: 2, isDemo: true })

function show(
  organizations: OrganizationDto[],
  current: OrganizationDto | undefined,
  isLoading = false,
) {
  render(
    <MemoryRouter>
      <OrganizationSwitcher organizations={organizations} current={current} isLoading={isLoading} />
    </MemoryRouter>,
  )
}

describe('OrganizationSwitcher', () => {
  describe('the box that is always visible', () => {
    it('shows the organization the person is in, with their role and its projects', () => {
      show([personal, studio, demo], studio)

      const box = screen.getByTitle('Switch organization')
      expect(within(box).getByText('Night Owls')).toBeTruthy()
      expect(within(box).getByText('member · 3 projects')).toBeTruthy()
    })

    it('says "1 project", not "1 projects"', () => {
      show([personal], personal)

      expect(within(screen.getByTitle('Switch organization')).getByText('owner · 1 project')).toBeTruthy()
    })

    it('asks to choose when the current organization is not one of theirs', () => {
      show([personal, studio], undefined)

      const box = screen.getByTitle('Switch organization')
      expect(within(box).getByText('Choose organization')).toBeTruthy()
      expect(within(box).getByText('2 organizations')).toBeTruthy()
    })

    it('keeps a box in place while the organizations load, so the sidebar does not jump', () => {
      show([], undefined, true)

      expect(screen.getByRole('status').textContent).toMatch(/organizations…/i)
      expect(screen.queryByTitle('Switch organization')).toBeNull()
    })
  })

  describe('the menu', () => {
    it('lists every organization of the person, each one a link to its overview', () => {
      show([personal, studio, demo], personal)

      const links = within(screen.getByText('Switch organization').parentElement!).getAllByRole('link')
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/organizations/1',
        '/organizations/2',
        '/organizations/3',
      ])
    })

    it('marks the current one, and only that one', () => {
      show([personal, studio, demo], studio)

      const links = screen.getAllByRole('link')
      const current = links.filter((link) => link.getAttribute('aria-current') === 'true')
      expect(current).toHaveLength(1)
      expect(current[0].getAttribute('href')).toBe('/organizations/2')
    })

    it('tags the demo as an example, and nothing else', () => {
      show([personal, studio, demo], personal)

      const tags = screen.getAllByText('example')
      expect(tags).toHaveLength(1)
      expect(tags[0].closest('a')?.getAttribute('href')).toBe('/organizations/3')
    })

    it('shows the role and project count of each organization', () => {
      show([personal, studio, demo], personal)

      expect(screen.getByText('member · 2 projects')).toBeTruthy() // the demo
      expect(screen.getAllByText('member · 3 projects').length).toBeGreaterThan(0) // the studio
    })
  })
})
