interface PaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

// "11–20 of 34 · page 2/4" plus ‹ ›. The count line shows even with a single page.
export function Pagination({ page, pageSize, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)

  return (
    <nav className="pagination" aria-label="Bug list pages">
      <span>
        {first}–{last} of {totalCount}
        {totalPages > 1 && ` · page ${page}/${totalPages}`}
      </span>
      {totalPages > 1 && (
        <span className="pagination-buttons">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </button>
        </span>
      )}
    </nav>
  )
}
