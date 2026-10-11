import { apiRequest } from './client'
import type { ProjectDto, ProjectRequest } from './types'

// Keys TanStack Query uses to cache each response. After a change, invalidating
// projectKeys.all refetches every project query on screen.
export const projectKeys = {
  all: ['projects'] as const,
  // The list of one organization's projects (what a person sees in the sidebar and the overview)
  ofOrganization: (organizationId: number) => ['projects', 'organization', organizationId] as const,
  detail: (id: number) => ['projects', id] as const,
}

// The projects of one organization, newest first. Fails with a 404 ApiError when the
// organization doesn't exist or the person isn't a member of it (the same answer for both).
export function getOrganizationProjects(organizationId: number) {
  return apiRequest<ProjectDto[]>(`/api/organizations/${organizationId}/projects`)
}

// A project is created inside an organization. 409 ApiError if its code is taken THERE.
export function createOrganizationProject(organizationId: number, project: ProjectRequest) {
  return apiRequest<ProjectDto>(`/api/organizations/${organizationId}/projects`, {
    method: 'POST',
    body: project,
  })
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
