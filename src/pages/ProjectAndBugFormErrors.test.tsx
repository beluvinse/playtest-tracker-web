import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { BugDto, ProjectDto } from '../api/types'
import { BugEditForm } from '../components/BugEditForm'
import { ProjectEditForm } from '../components/ProjectEditForm'
import { installFakeApi } from '../test/fakeApi'
import { NewBugPage } from './NewBugPage'
import { NewProjectPage } from './NewProjectPage'

const project: ProjectDto = {
  id: 1,
  organizationId: 1,
  name: 'Pink in the Night',
  code: 'PIN',
  description: null,
  createdAt: '2026-10-06T13:12:23+00:00',
  bugCount: 0,
  openCriticalCount: 0,
}

const bug: BugDto = {
  id: 7,
  projectId: 1,
  title: 'Neon sign flickers',
  description: 'It flickers too fast to read.',
  severity: 'Medium',
  status: 'Open',
  createdAt: '2026-10-06T13:12:23+00:00',
}

function show(element: ReactElement, path = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={element} />
          <Route path="/projects/:projectId/bugs/new" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const write = (label: string, value: string) =>
  fireEvent.input(screen.getByLabelText(label), { target: { value } })

describe('errors on the project and bug forms', () => {
  it('new project: empty name shows our message and sends nothing', () => {
    const api = installFakeApi({})
    show(<NewProjectPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    // name and code are both empty and required
    expect(screen.getAllByText('This field is required.')).toHaveLength(2)
    expect(api.count('POST /api/projects')).toBe(0)
    expect(document.activeElement).toBe(screen.getByLabelText('Game name'))
  })

  it('new project: a name that is too short says how long it has to be', () => {
    const api = installFakeApi({})
    show(<NewProjectPage />)

    write('Game name', 'A') // the code follows the name, so only the name is wrong
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(screen.getByText('Use at least 2 characters.')).toBeTruthy()
    expect(api.count('POST /api/projects')).toBe(0)
  })

  it('new project: a code that is not 3 letters explains the format', () => {
    installFakeApi({})
    show(<NewProjectPage />)

    write('Game name', 'Pink in the Night')
    write('Code', 'PI')
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    expect(screen.getByText('Use at least 3 characters.')).toBeTruthy()
  })

  it('new project: a valid form is sent', async () => {
    const api = installFakeApi({ 'POST /api/projects': { status: 201, body: project } })
    show(<NewProjectPage />)

    write('Game name', 'Pink in the Night')
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    await vi.waitFor(() => expect(api.count('POST /api/projects')).toBe(1))
  })

  it('edit project: an emptied name is caught before the request', () => {
    const api = installFakeApi({})
    show(<ProjectEditForm project={project} onDone={() => {}} />)

    write('Game name', '   ')
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByText('This field is required.')).toBeTruthy()
    expect(api.count('PUT /api/projects/1')).toBe(0)
  })

  it('new bug: empty title and short description show our messages', async () => {
    const api = installFakeApi({ 'GET /api/projects/1': { status: 200, body: project } })
    show(<NewBugPage />, '/projects/1/bugs/new')

    await screen.findByText('Report a bug in Pink in the Night')
    write('Title', 'Ok title')
    write('What happened steps, expected vs actual', 'short')
    fireEvent.click(screen.getByRole('button', { name: 'Report bug' }))

    expect(screen.getByText('Use at least 10 characters.')).toBeTruthy()
    expect(api.count('POST /api/projects/1/bugs')).toBe(0)
  })

  it('new bug: the message goes away when the person types in that field', async () => {
    installFakeApi({ 'GET /api/projects/1': { status: 200, body: project } })
    show(<NewBugPage />, '/projects/1/bugs/new')
    await screen.findByText('Report a bug in Pink in the Night')

    fireEvent.click(screen.getByRole('button', { name: 'Report bug' }))
    expect(screen.getAllByText('This field is required.')).toHaveLength(2)

    write('Title', 'Neon')

    expect(screen.getAllByText('This field is required.')).toHaveLength(1)
  })

  it('edit bug: a title that is too short is caught before the request', () => {
    const api = installFakeApi({})
    show(<BugEditForm bug={bug} onDone={() => {}} />)

    write('Title', 'ab')
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByText('Use at least 3 characters.')).toBeTruthy()
    expect(api.count('PATCH /api/bugs/7')).toBe(0)
  })
})
