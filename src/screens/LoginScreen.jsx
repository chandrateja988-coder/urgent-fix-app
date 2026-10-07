import { useState } from 'react'

import Button from '../components/Button'
import Card from '../components/Card'
import InputField from '../components/InputField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Screen 1 - Login.
 * Demo only: any non-empty email + password logs the renter in.
 */
export default function LoginScreen({ onLogIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Enter the email address you registered with.'
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password.trim()) {
      nextErrors.password = 'Enter your password.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onLogIn({ email: email.trim() })
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold text-ink">Log in</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Report an urgent repair to your rental provider and keep a record of the
        notice you sent.
      </p>

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
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Your password"
            autoComplete="current-password"
            error={errors.password}
          />

          <Button type="submit">Log in</Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-xs text-ink-soft">
        Demo only — any email and password will log you in.
      </p>
    </div>
  )
}
