/** Converts common Ethiopian mobile number forms to E.164 without guessing. */
export function normalizeEthiopianPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s()\-.]/g, '')
  let national: string | null = null

  if (/^09\d{8}$/.test(compact)) national = compact.slice(1)
  else if (/^9\d{8}$/.test(compact)) national = compact
  else if (/^\+?2519\d{8}$/.test(compact)) national = compact.replace(/^\+?251/, '')

  return national ? `+251${national}` : null
}
