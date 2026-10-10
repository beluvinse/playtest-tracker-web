// Short codes in the style of the design: "Pink in the Night" → "PIN", bug 7 → "PIN-007".
// They are only for display: the API doesn't store a code, so it's derived from the name.
// (Real per-project numbering, where each project starts at 001, would need the backend.)

export function projectCode(name: string): string {
  const letters = name.replace(/[^a-z0-9]/gi, '').toUpperCase()
  return letters.slice(0, 3) || 'PRJ'
}

export function bugCode(projectName: string, bugId: number): string {
  return `${projectCode(projectName)}-${String(bugId).padStart(3, '0')}`
}
