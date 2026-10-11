import { useQueries, useQuery } from '@tanstack/react-query'
import { bugKeys, getProjectBugs } from '../api/bugs'
import type { BugListParams } from '../api/types'

// The API has no "counts" endpoint, so a count is a list request with pageSize 1:
// we only read its totalCount, not the single bug that comes with it.
// (Critical bugs still pending don't need this: each project carries openCriticalCount.)

function countParams(filter: BugListParams): BugListParams {
  return { ...filter, pageSize: 1 }
}

// How many bugs of one project match the filter (undefined while it loads)
export function useProjectBugCount(projectId: number, filter: BugListParams) {
  const params = countParams(filter)
  return useQuery({
    queryKey: bugKeys.ofProject(projectId, params),
    queryFn: () => getProjectBugs(projectId, params),
    select: (page) => page.totalCount,
  }).data
}

// How many bugs match the filter across a group of projects: the sum of each one's count
// (undefined until every project has answered). It is used for "the bugs of an organization".
// The search across everything (GET /api/bugs) wouldn't do: it covers ALL the organizations the
// person is in, not just the one on screen. Each count uses the same key as useProjectBugCount,
// so a project that was already counted is not asked for again.
export function useProjectsBugCount(projectIds: number[], filter: BugListParams) {
  const params = countParams(filter)
  const counts = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: bugKeys.ofProject(projectId, params),
      queryFn: () => getProjectBugs(projectId, params),
      select: (page: { totalCount: number }) => page.totalCount,
    })),
  })

  if (counts.some((count) => count.data === undefined)) return undefined
  return counts.reduce((sum, count) => sum + (count.data ?? 0), 0)
}
