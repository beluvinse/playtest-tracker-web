import { apiRequest } from './client'
import type { DemoInfoDto } from './types'

export const demoKeys = {
  info: ['demo'] as const,
}

// The demo accounts and their shared password. It needs no token (it is for people who haven't
// signed in yet). Fails with a 404 ApiError when the API has no demo.
export function getDemoInfo() {
  return apiRequest<DemoInfoDto>('/api/demo')
}
