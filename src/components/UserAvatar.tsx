// A small pixel face for a person, like the avatars in the design. The color comes from their id,
// so the same person always gets the same one, and different people tend to get different ones.

const colors = [
  'var(--accent-brand)',
  'var(--signal-success)',
  'var(--signal-open)',
  'var(--signal-high)',
  'var(--signal-progress)',
]

interface UserAvatarProps {
  userId: string
  size?: number
}

export function UserAvatar({ userId, size = 28 }: UserAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="8" height="8" fill={colors[hash(userId) % colors.length]} />
      {/* Two eyes and a mouth. The face color is the "text on a colored button" color, so it
          stays readable on every background, in both themes. */}
      <path fill="var(--accent-on)" d="M2 3h1v1h-1zM5 3h1v1h-1zM2 5h4v1h-4z" />
    </svg>
  )
}

// Turns any text into a whole number, always the same one for the same text (a tiny "hash")
function hash(text: string): number {
  let result = 0
  for (const character of text) {
    result = (result * 31 + character.charCodeAt(0)) >>> 0 // stays a positive 32-bit number
  }
  return result
}
