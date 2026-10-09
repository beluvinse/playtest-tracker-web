import { apiRequest } from './client'
import type {
  BugDto,
  BugListParams,
  CreateBugRequest,
  PagedResult,
  PatchBugRequest,
  UpdateBugRequest,
} from './types'

export const bugKeys = {
  all: ['bugs'] as const,
  ofProject: (projectId: number, params: BugListParams) =>
    ['bugs', 'project', projectId, params] as const,
  search: (params: BugListParams & { projectId?: number }) => ['bugs', 'search', params] as const,
  detail: (id: number) => ['bugs', id] as const,
}

// ---- Inside a project ----

// Fails with a 404 ApiError when the project does not exist
export function getProjectBugs(projectId: number, params: BugListParams = {}) {
  return apiRequest<PagedResult<BugDto>>(`/api/projects/${projectId}/bugs`, { query: params })
}

export function createBug(projectId: number, bug: CreateBugRequest) {
  return apiRequest<BugDto>(`/api/projects/${projectId}/bugs`, { method: 'POST', body: bug })
}

// ---- Across every project ----

export function searchBugs(params: BugListParams & { projectId?: number } = {}) {
  return apiRequest<PagedResult<BugDto>>('/api/bugs', { query: params })
}

// ---- A single bug ----

export function getBug(id: number) {
  return apiRequest<BugDto>(`/api/bugs/${id}`)
}

// PUT replaces the whole bug: every field is required
export function updateBug(id: number, bug: UpdateBugRequest) {
  return apiRequest<BugDto>(`/api/bugs/${id}`, { method: 'PUT', body: bug })
}

// PATCH changes only the fields sent, e.g. patchBug(5, { status: 'Resolved' })
export function patchBug(id: number, changes: PatchBugRequest) {
  return apiRequest<BugDto>(`/api/bugs/${id}`, { method: 'PATCH', body: changes })
}

export function deleteBug(id: number) {
  return apiRequest<void>(`/api/bugs/${id}`, { method: 'DELETE' })
}
