/**
 * api.js - the only place the React app talks to the Python backend.
 *
 * The browser only ever calls our own /api address. The Supabase secret key
 * lives on the Python side (environment variables) and never appears here.
 */

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const OFFLINE_ERROR =
  'We could not reach the server. Check your connection and try again.'

/** Turns the backend's error body into one short sentence for the screen. */
function messageFromBody(body) {
  const detail = body?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    return String(detail[0].msg ?? '').replace(/^Value error, /, '') || null
  }

  return null
}

async function request(path, options) {
  let response

  try {
    response = await fetch(path, options)
  } catch {
    throw new Error(OFFLINE_ERROR)
  }

  let body = null

  try {
    body = await response.json()
  } catch {
    // The server did not send JSON (for example a crashed server) - keep body null.
  }

  if (!response.ok) {
    throw new Error(messageFromBody(body) ?? GENERIC_ERROR)
  }

  return body
}

/** Saves one repair report. Resolves with the saved row (including its id). */
export function saveReport({ email, report, contact }) {
  return request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_email: email,
      description: report.description.trim(),
      date_noticed: report.noticedOn,
      photo_name: report.photo?.name ?? null,
      photo_size: report.photo?.size ?? null,
      rental_address: contact.address.trim(),
      contact_email: contact.email.trim(),
    }),
  })
}

/** Loads the newest saved reports for one renter. Resolves with an array. */
export function loadReports(email) {
  return request(`/api/reports?user_email=${encodeURIComponent(email)}`)
}
