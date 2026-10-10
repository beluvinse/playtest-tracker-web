import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { bugStatuses, severities } from '../api/types'
import { sortOptions } from '../hooks/useBugFilters'
import type { BugFilters, FilterName, SortKey } from '../hooks/useBugFilters'

interface BugFilterBarProps {
  filters: BugFilters
  onChange: (name: FilterName, value: string | undefined) => void
  onClear: () => void
  hasFilters: boolean
}

// A single line of "key:value" tokens, like a debug console: › search  status:open  severity:any
export function BugFilterBar({ filters, onChange, onClear, hasFilters }: BugFilterBarProps) {
  return (
    <div className="filter-row" role="search" aria-label="Bug filters">
      <span className="filter-prompt" aria-hidden="true">
        ›
      </span>

      {/* key: when the search in the URL changes from outside (Back button, "clear"),
          React creates a new box, so the text inside matches the URL again */}
      <SearchBox
        key={filters.search ?? ''}
        value={filters.search}
        onSearch={(text) => onChange('search', text)}
      />

      <TokenSelect
        name="status"
        value={filters.status ?? ''}
        onChange={(value) => onChange('status', value)}
      >
        <option value="">any</option>
        {bugStatuses.map((status) => (
          <option key={status} value={status}>
            {toTokenText(status)}
          </option>
        ))}
      </TokenSelect>

      <TokenSelect
        name="severity"
        value={filters.severity ?? ''}
        onChange={(value) => onChange('severity', value)}
      >
        <option value="">any</option>
        {severities.map((severity) => (
          <option key={severity} value={severity}>
            {toTokenText(severity)}
          </option>
        ))}
      </TokenSelect>

      <TokenSelect name="sort" value={filters.sort} onChange={(value) => onChange('sort', value)}>
        {(Object.keys(sortOptions) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {sortOptions[key].label.toLowerCase()}
          </option>
        ))}
      </TokenSelect>

      {hasFilters && (
        <button type="button" className="filter-clear" onClick={onClear}>
          clear
        </button>
      )}
    </div>
  )
}

interface TokenSelectProps {
  name: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

// A <select> dressed as a "name:value" token. It is highlighted while it filters something.
function TokenSelect({ name, value, onChange, children }: TokenSelectProps) {
  const isActive = name !== 'sort' && value !== ''
  return (
    <label className="token" data-active={isActive}>
      <span className="token-key">{name}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  )
}

// "InProgress" → "in-progress", the style of the design's tokens
function toTokenText(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
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
    <form className="filter-search" onSubmit={handleSubmit}>
      <input
        type="search"
        aria-label="Search bugs by title or description"
        placeholder="search title or description ⏎"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </form>
  )
}
