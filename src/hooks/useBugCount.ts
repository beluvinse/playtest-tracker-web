import { useQueries, useQuery } from '@tanstack/react-query'
import { bugKeys, getProjectBugs, searchBugs } from '../api/bugs'
import type { BugListParams } from '../api/types'

// The API has no "counts" endpoint, so a count is a list request with pageSize 1:
// we only read its totalCount, not the single bug that comes with it.

// Critical bugs that still need work. Shared, so every screen counts them the same way
// (and the same filter means the same query key, so they share the cache too).
export const openCritical: BugListParams = { status: 'Open', severity: 'Critical' }

function countParams(filter: BugListParams): BugListParams {
  return { ...filter, pageSize: 1 }
}

function projectCountQuery(projectId: number, filter: BugListParams) {
  const params = countParams(filter)
  return {
    queryKey: bugKeys.ofProject(projectId, params),
    queryFn: () => getProjectBugs(projectId, params),
    select: (page: { totalCount: number }) => page.totalCount,
  }
}

// How many bugs of one project match the filter (undefined while it loads)
export function useProjectBugCount(projectId: number, filter: BugListParams) {
  return useQuery(projectCountQuery(projectId, filter)).data
}

// The same count for several projects at once: one small request per project.
// Returns a map { projectId: count }; a project is missing while its count loads.
export function useProjectsBugCounts(projectIds: number[], filter: BugListParams) {
  const results = useQueries({
    queries: projectIds.map((id) => projectCountQuery(id, filter)),
  })

  const counts: Record<number, number> = {}
  projectIds.forEach((id, index) => {
    const count = results[index].data
    if (count !== undefined) counts[id] = count
  })
  return counts
}

// How many bugs across every project match the filter (GET /api/bugs)
export function useAllBugCount(filter: BugListParams) {
  const params = countParams(filter)
  return useQuery({
    queryKey: bugKeys.search(params),
    queryFn: () => searchBugs(params),
    select: (page) => page.totalCount,
  }).data
}
