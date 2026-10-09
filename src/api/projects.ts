import { apiRequest } from './client'
import type { ProjectDto, ProjectRequest } from './types'

// Keys TanStack Query uses to cache each response. After a change, invalidating
// projectKeys.all refetches every project query on screen.
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: number) => ['projects', id] as const,
}

export function getProjects() {
  return apiRequest<ProjectDto[]>('/api/projects')
}

export function getProject(id: number) {
  return apiRequest<ProjectDto>(`/api/projects/${id}`)
}

export function createProject(project: ProjectRequest) {
  return apiRequest<ProjectDto>('/api/projects', { method: 'POST', body: project })
}

export function updateProject(id: number, project: ProjectRequest) {
  return apiRequest<ProjectDto>(`/api/projects/${id}`, { method: 'PUT', body: project })
}

// Fails with a 409 ApiError while the project still has bugs
export function deleteProject(id: number) {
  return apiRequest<void>(`/api/projects/${id}`, { method: 'DELETE' })
}
