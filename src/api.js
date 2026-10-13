/**
 * api.js - the only place the React app talks to the Python backend.
 *
 * The browser only ever calls our own /api address. The Supabase secret key
 * lives on the Python side (environment variables) and never appears here.
 *
 * After a renter logs in, the backend sends back a signed session token. We keep
 * it in memory only (not in localStorage), so closing or refreshing the tab logs
 * the renter out, and it is sent with every report request.
 */

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const OFFLINE_ERROR =
  'We could not reach the server. Check your connection and try again.'

let sessionToken = null

/** Remembers (or forgets, with null) the session token for this browser tab. */
export function setSessionToken(token) {
  sessionToken = token || null
}

/** An error that also carries the HTTP status (for example 401 = not logged in). */
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Turns the backend's error body into one short sentence for the screen. */
function messageFromBody(body) {
  const detail = body?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    return String(detail[0].msg ?? '').replace(/^Value error, /, '') || null
  }

  return null
}

async function request(path, options = {}) {
  const headers = { ...(options.headers ?? {}) }

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`
  }

  let response

  try {
    response = await fetch(path, { ...options, headers })
  } catch {
    throw new ApiError(OFFLINE_ERROR)
  }

  let body = null

  try {
    body = await response.json()
  } catch {
    // The server did not send JSON (for example a crashed server) - keep body null.
  }

  if (!response.ok) {
    throw new ApiError(messageFromBody(body) ?? GENERIC_ERROR, response.status)
  }

  return body
}

function sendCredentials(path, { email, password }) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  }).then((body) => {
    setSessionToken(body.token)
    return { email: body.email }
  })
}

/** Creates an account, logs the renter in and resolves with { email }. */
export function signUp(credentials) {
  return sendCredentials('/api/auth/signup', credentials)
}

/** Logs the renter in and resolves with { email }. */
export function logIn(credentials) {
  return sendCredentials('/api/auth/login', credentials)
}

/** Saves one repair report. Resolves with the saved row (including its id). */
export function saveReport({ report, contact }) {
  return request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: report.description.trim(),
      date_noticed: report.noticedOn,
      photo_name: report.photo?.name ?? null,
      photo_size: report.photo?.size ?? null,
      rental_address: contact.address.trim(),
      contact_email: contact.email.trim(),
    }),
  })
}

/** Loads the newest saved reports for the logged-in renter. Resolves with an array. */
export function loadReports() {
  return request('/api/reports')
}
