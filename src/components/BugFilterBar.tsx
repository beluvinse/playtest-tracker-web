import { useState } from 'react'
import type { FormEvent } from 'react'
import { bugStatuses, severities } from '../api/types'
import { sortOptions } from '../hooks/useBugFilters'
import type { BugFilters, FilterName, SortKey } from '../hooks/useBugFilters'
import { statusLabels } from '../utils/format'

interface BugFilterBarProps {
  filters: BugFilters
  onChange: (name: FilterName, value: string | undefined) => void
}

export function BugFilterBar({ filters, onChange }: BugFilterBarProps) {
  return (
    <div className="filter-bar">
      {/* key: when the search in the URL changes from outside (Back button, "Clear filters"),
          React creates a new box, so the text inside matches the URL again */}
      <SearchBox
        key={filters.search ?? ''}
        value={filters.search}
        onSearch={(text) => onChange('search', text)}
      />

      <label className="field">
        <span className="field-label">Status</span>
        <select value={filters.status ?? ''} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">All</option>
          {bugStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Severity</span>
        <select value={filters.severity ?? ''} onChange={(e) => onChange('severity', e.target.value)}>
          <option value="">All</option>
          {severities.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Sort</span>
        <select value={filters.sort} onChange={(e) => onChange('sort', e.target.value)}>
          {(Object.keys(sortOptions) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {sortOptions[key].label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

interface SearchBoxProps {
  value: string | undefined
  onSearch: (text: string) => void
}

// The search is applied on Enter (not on every key), so the URL and the API
// get one request per search instead of one per letter
function SearchBox({ value, onSearch }: SearchBoxProps) {
  const [text, setText] = useState(value ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault() // a form would otherwise reload the whole page
    onSearch(text.trim())
  }

  return (
    <form className="field field-search" role="search" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="bug-search">
        Search
      </label>
      <input
        id="bug-search"
        type="search"
        placeholder="Title or description, then Enter"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </form>
  )
}
