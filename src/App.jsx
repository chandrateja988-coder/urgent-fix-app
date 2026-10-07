import { useState } from 'react'

import { saveReport } from './api'
import AppHeader from './components/AppHeader'
import ConfirmationScreen from './screens/ConfirmationScreen'
import LoginScreen from './screens/LoginScreen'
import MyReportsScreen from './screens/MyReportsScreen'
import PropertyDetailsScreen from './screens/PropertyDetailsScreen'
import ReportIssueScreen from './screens/ReportIssueScreen'

/** The screens of the app, switched with plain React state (no router). */
const SCREENS = {
  LOGIN: 'login',
  REPORT: 'report',
  DETAILS: 'details',
  CONFIRMATION: 'confirmation',
  REPORTS: 'reports',
}

const STEP_BY_SCREEN = {
  [SCREENS.REPORT]: 1,
  [SCREENS.DETAILS]: 2,
  [SCREENS.CONFIRMATION]: 3,
}

const EMPTY_REPORT = { description: '', noticedOn: '', photo: null }
const EMPTY_CONTACT = { address: '', email: '' }

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LOGIN)
  const [account, setAccount] = useState(null)
  const [report, setReport] = useState(EMPTY_REPORT)
  const [contact, setContact] = useState(EMPTY_CONTACT)
  const [savedReport, setSavedReport] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function updateReport(field, value) {
    setReport((current) => ({ ...current, [field]: value }))
  }

  function updateContact(field, value) {
    setContact((current) => ({ ...current, [field]: value }))
  }

  function handleLogIn(credentials) {
    setAccount(credentials)
    setScreen(SCREENS.REPORT)
  }

  /** Sends the finished report to the Python API, which saves it in Supabase. */
  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')

    try {
      const saved = await saveReport({ email: account.email, report, contact })
      setSavedReport(saved)
      setScreen(SCREENS.CONFIRMATION)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDone() {
    setReport(EMPTY_REPORT)
    setContact(EMPTY_CONTACT)
    setSavedReport(null)
    setSubmitError('')
    setAccount(null)
    setScreen(SCREENS.LOGIN)
  }

  /** Starts a fresh report while staying signed in. */
  function handleNewReport() {
    setReport(EMPTY_REPORT)
    setContact(EMPTY_CONTACT)
    setSavedReport(null)
    setSubmitError('')
    setScreen(SCREENS.REPORT)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        currentStep={STEP_BY_SCREEN[screen] ?? null}
        signedInAs={account?.email ?? null}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        {screen === SCREENS.LOGIN && <LoginScreen onLogIn={handleLogIn} />}

        {screen === SCREENS.REPORT && (
          <ReportIssueScreen
            report={report}
            onChange={updateReport}
            onContinue={() => setScreen(SCREENS.DETAILS)}
            onBack={() => setScreen(SCREENS.LOGIN)}
            onViewReports={() => setScreen(SCREENS.REPORTS)}
          />
        )}

        {screen === SCREENS.DETAILS && (
          <PropertyDetailsScreen
            contact={contact}
            onChange={updateContact}
            onSubmit={handleSubmit}
            onBack={() => setScreen(SCREENS.REPORT)}
            submitting={submitting}
            submitError={submitError}
          />
        )}

        {screen === SCREENS.CONFIRMATION && (
          <ConfirmationScreen
            report={report}
            contact={contact}
            reference={savedReport?.id ? savedReport.id.slice(0, 8).toUpperCase() : ''}
            onDone={handleDone}
            onViewReports={() => setScreen(SCREENS.REPORTS)}
          />
        )}

        {screen === SCREENS.REPORTS && (
          <MyReportsScreen email={account.email} onNewReport={handleNewReport} />
        )}
      </main>

      <footer className="border-t border-line/70 px-4 py-5 text-center text-xs text-ink-soft sm:px-6">
        Urgent Fix is a demo. For a real urgent repair, contact your rental provider or
        Consumer Affairs Victoria.
      </footer>
    </div>
  )
}
