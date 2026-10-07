import { useEffect, useState } from 'react'

import { loadReports } from '../api'
import Button from '../components/Button'
import Card from '../components/Card'
import { formatDateForSummary, formatSavedAt } from '../utils/formatters'

/** One saved report in the history list. */
function ReportItem({ report }) {
  return (
    <li className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className="text-sm font-semibold break-words whitespace-pre-line text-ink">
          {report.description}
        </p>
        <p className="shrink-0 text-xs text-ink-soft">{formatSavedAt(report.created_at)}</p>
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-ink-soft">First noticed</dt>
          <dd className="text-ink">{formatDateForSummary(report.date_noticed)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-ink-soft">Address</dt>
          <dd className="min-w-0 break-words text-ink">{report.rental_address}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-ink-soft">Photo</dt>
          <dd className="min-w-0 break-words text-ink">{report.photo_name || 'None'}</dd>
        </div>
      </dl>
    </li>
  )
}

/**
 * My reports - loads the renter's saved reports back from the database
 * (React -> Python API -> Supabase) and lists them, newest first.
 */
export default function MyReportsScreen({ email, onNewReport }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [reports, setReports] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    setStatus('loading')

    loadReports(email)
      .then((data) => {
        if (cancelled) return
        setReports(Array.isArray(data) ? data : [])
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setErrorMessage(error.message)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [email, attempt])

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold text-ink">My reports</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Reports saved for {email}, newest first.
      </p>

      <div className="mt-6">
        {status === 'loading' && (
          <Card>
            <p className="text-sm text-ink-soft" role="status">
              Loading your reports…
            </p>
          </Card>
        )}

        {status === 'error' && (
          <Card>
            <p className="text-sm font-medium text-red-600" role="alert">
              {errorMessage}
            </p>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setAttempt((count) => count + 1)}>
                Try again
              </Button>
            </div>
          </Card>
        )}

        {status === 'ready' && reports.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              You have no saved reports yet. Submit one and it will appear here.
            </p>
          </Card>
        )}

        {status === 'ready' && reports.length > 0 && (
          <ul className="space-y-4">
            {reports.map((report) => (
              <ReportItem key={report.id} report={report} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <Button onClick={onNewReport}>Report a new issue</Button>
      </div>
    </div>
  )
}
