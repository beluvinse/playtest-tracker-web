interface PaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

// "Showing 11–20 of 34" plus Previous / Next. Hidden when everything fits on one page.
export function Pagination({ page, pageSize, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) {
    return null
  }

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)

  return (
    <nav className="pagination" aria-label="Bug list pages">
      <span className="muted">
        Showing {first}–{last} of {totalCount}
      </span>
      <div className="pagination-buttons">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Previous
        </button>
        <span className="muted">
          Page {page} of {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </nav>
  )
}
