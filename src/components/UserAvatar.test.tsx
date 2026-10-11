import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserAvatar } from './UserAvatar'

function colorOf(userId: string) {
  const { container, unmount } = render(<UserAvatar userId={userId} />)
  const color = container.querySelector('rect')!.getAttribute('fill')
  unmount()
  return color
}

describe('UserAvatar', () => {
  it('gives the same person the same color every time', () => {
    expect(colorOf('3f2a-user')).toBe(colorOf('3f2a-user'))
  })

  it('gives different people a variety of colors', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `user-${i}`)

    const colors = new Set(ids.map(colorOf))

    expect(colors.size).toBeGreaterThan(2)
  })

  it('is decoration: hidden from screen readers (the menu button carries the name)', () => {
    const { container } = render(<UserAvatar userId="x" />)

    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})
