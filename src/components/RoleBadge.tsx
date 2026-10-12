import type { OrganizationRole } from '../api/types'

// "OWNER" or "MEMBER": what a person is inside an organization. The color comes from CSS
// (data-role), so the Owner stands out a little without shouting.
export function RoleBadge({ role }: { role: OrganizationRole }) {
  return (
    <span className="role-badge" data-role={role}>
      {role}
    </span>
  )
}
