import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { BugDto } from '../api/types'
import { installFakeApi } from '../test/fakeApi'
import { BugList } from './BugList'

const bug: BugDto = {
  id: 7,
  projectId: 1,
  title: 'Neon sign flickers',
  description: 'It flickers too fast to read.',
  severity: 'Medium',
  status: 'Open',
  createdAt: '2026-10-06T13:12:23+00:00',
}

function showTheList() {
  installFakeApi({
    'GET /api/projects/1/bugs': {
      status: 200,
      body: { items: [bug], page: 1, pageSize: 10, totalCount: 1 },
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/1']}>
        <Routes>
          <Route
            path="/projects/:projectId"
            element={<BugList projectId={1} projectCode="PIN" header={<h1>Project</h1>} />}
          />
          <Route path="/bugs/:bugId" element={<p>The page of the bug</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// A whole row opens its bug. This is done with a click handler on the row and NOT with an
// invisible layer stretched over it: on some phones that layer covered the entire page and every
// tap (on "Report bug", on the filters) opened a bug.
describe('the rows of the bug list', () => {
  it('open the bug when you click anywhere on the row, not only on the title', async () => {
    showTheList()

    const idCell = await screen.findByText('PIN-007')
    fireEvent.click(idCell)

    expect(await screen.findByText('The page of the bug')).toBeTruthy()
  })

  it('still have the title as a real link, for the keyboard and "open in a new tab"', async () => {
    showTheList()

    const link = await screen.findByRole('link', { name: 'Neon sign flickers' })

    expect(link.getAttribute('href')).toBe('/bugs/7')
  })

  it('do not open the bug while somebody is selecting text to copy it', async () => {
    showTheList()
    const idCell = await screen.findByText('PIN-007')

    const range = document.createRange()
    range.selectNodeContents(idCell)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    fireEvent.click(idCell)

    expect(screen.queryByText('The page of the bug')).toBeNull()
    window.getSelection()?.removeAllRanges()
  })
})
