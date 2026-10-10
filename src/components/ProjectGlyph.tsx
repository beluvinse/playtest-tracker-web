// A small pixel "logo" for each project, generated from its id: the same project always
// gets the same picture, and different projects get different ones (like GitHub's identicons).

const colors = [
  'var(--accent-brand)',
  'var(--signal-success)',
  'var(--signal-open)',
  'var(--signal-high)',
  'var(--signal-progress)',
]

interface ProjectGlyphProps {
  projectId: number
  size?: number
}

export function ProjectGlyph({ projectId, size = 20 }: ProjectGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
      <path fill={colors[projectId % colors.length]} d={glyphPath(projectId)} />
    </svg>
  )
}

// Fills the left half of a 6×6 area at random (seeded by the id) and mirrors it to the
// right, so the result is symmetric and reads as a sprite instead of noise
function glyphPath(projectId: number): string {
  const random = seededRandom(projectId)
  let path = ''

  for (let y = 1; y < 7; y++) {
    for (let x = 1; x < 4; x++) {
      if (random() < 0.55) {
        path += `M${x} ${y}h1v1h-1z` // the pixel on the left
        path += `M${7 - x} ${y}h1v1h-1z` // and its mirror on the right
      }
    }
  }

  // Never leave a project without a picture
  return path || 'M3 3h2v2h-2z'
}

// Math.random() would give a new picture on every render; this one ("mulberry32") repeats
// for the same seed. Math.imul multiplies as 32-bit integers, so the numbers never lose precision.
function seededRandom(seed: number) {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
