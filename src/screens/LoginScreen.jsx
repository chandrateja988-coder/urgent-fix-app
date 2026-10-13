import { useState } from 'react'

import { logIn, signUp } from '../api'
import Button from '../components/Button'
import Card from '../components/Card'
import InputField from '../components/InputField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const PASSWORD_RULE = `At least ${MIN_PASSWORD_LENGTH} characters, with a letter and a number.`

/**
 * Screen 1 - Log in or create an account.
 * The Python backend checks the password (stored as a salted hash in Supabase)
 * and sends back a session token, so each renter only sees their own reports.
 */
export default function LoginScreen({ onLogIn, notice = '', initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    setServerError('')
    setPassword('')
    setConfirmPassword('')
  }

  function validate() {
    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = isSignUp
        ? 'Enter the email address you want to use.'
        : 'Enter the email address you registered with.'
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = isSignUp ? 'Choose a password.' : 'Enter your password.'
    } else if (
      isSignUp &&
      (password.length < MIN_PASSWORD_LENGTH || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    ) {
      nextErrors.password = PASSWORD_RULE
    }

    if (isSignUp && !nextErrors.password && confirmPassword !== password) {
      nextErrors.confirmPassword = 'The two passwords do not match.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)

    try {
      const account = isSignUp
        ? await signUp({ email, password })
        : await logIn({ email, password })
      onLogIn(account)
    } catch (error) {
      setServerError(error.message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold text-ink">
        {isSignUp ? 'Create account' : 'Log in'}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {isSignUp
          ? 'Make an account so your repair reports are saved and only you can see them.'
          : 'Report an urgent repair to your rental provider and keep a record of the notice you sent.'}
      </p>

      {notice && (
        <p
          className="mt-4 rounded-lg bg-brand-soft px-4 py-3 text-sm text-ink"
          role="status"
        >
          {notice}
        </p>
      )}

      <Card className="mt-6">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <InputField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
          />

          <InputField
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder={isSignUp ? 'Choose a password' : 'Your password'}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            helpText={isSignUp ? PASSWORD_RULE : undefined}
            error={errors.password}
          />

          {isSignUp && (
            <InputField
              id="confirm-password"
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Type the password again"
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Show password
          </label>

          {serverError && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy
              ? isSignUp
                ? 'Creating account…'
                : 'Logging in…'
              : isSignUp
                ? 'Create account'
                : 'Log in'}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-ink-soft">
        {isSignUp ? 'Already have an account? ' : 'New to Urgent Fix? '}
        <button
          type="button"
          onClick={() => switchMode(isSignUp ? 'login' : 'signup')}
          disabled={busy}
          className="font-semibold text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {isSignUp ? 'Log in' : 'Create an account'}
        </button>
      </p>

      <p className="mt-3 text-center text-xs text-ink-soft">
        Passwords are stored as salted hashes, never as plain text.
      </p>
    </div>
  )
}
