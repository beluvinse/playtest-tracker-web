import { useQuery } from '@tanstack/react-query'
import { bugKeys, getProjectBugs, searchBugs } from '../api/bugs'
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

// How many bugs across every project match the filter (GET /api/bugs)
export function useAllBugCount(filter: BugListParams) {
  const params = countParams(filter)
  return useQuery({
    queryKey: bugKeys.search(params),
    queryFn: () => searchBugs(params),
    select: (page) => page.totalCount,
  }).data
}
