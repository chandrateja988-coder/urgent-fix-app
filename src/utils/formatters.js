/**
 * Formats an ISO date string (yyyy-mm-dd, as produced by <input type="date">)
 * into a human readable Victorian/Australian style date, e.g. "4 March 2026".
 */
export function formatDateForSummary(isoDate) {
  if (!isoDate) return 'Not provided'

  const parsed = new Date(`${isoDate}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return isoDate

  return parsed.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Formats a byte count as a short, readable string, e.g. "1.4 MB". */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const size = bytes / 1024 ** unitIndex
  const rounded = unitIndex === 0 ? size : Math.round(size * 10) / 10

  return `${rounded} ${units[unitIndex]}`
}

/** Formats a database timestamp as a short Melbourne date and time, e.g. "7 Oct 2026, 9:41 pm". */
export function formatSavedAt(isoTimestamp) {
  if (!isoTimestamp) return ''

  const parsed = new Date(isoTimestamp)

  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Australia/Melbourne',
  })
}
