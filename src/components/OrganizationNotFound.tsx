import { Link } from 'react-router'

// For an address with an organization that doesn't exist, or one the person isn't a member of.
// The API answers both the same way (404), so this page doesn't say which it is.
export function OrganizationNotFound() {
  return (
    <section className="page-body">
      <h2>Organization not found</h2>
      <p className="muted">It may have been deleted, you may not be a member of it, or the link is wrong.</p>
      <Link to="/">Go to my organizations</Link>
    </section>
  )
}
