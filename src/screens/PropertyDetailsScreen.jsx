import { useState } from 'react'

import Button from '../components/Button'
import Card from '../components/Card'
import InputField from '../components/InputField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Screen 3 - Property & contact details.
 * Collects the rental address and the contact email for the notice.
 */
export default function PropertyDetailsScreen({
  contact,
  onChange,
  onSubmit,
  onBack,
  submitting = false,
  submitError = '',
}) {
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!contact.address.trim()) {
      nextErrors.address = 'Enter the address of the rental property.'
    }

    if (!contact.email.trim()) {
      nextErrors.email = 'Enter an email address for your provider to reply to.'
    } else if (!EMAIL_PATTERN.test(contact.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onSubmit()
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold text-ink">Property &amp; contact details</h1>
      <p className="mt-1 text-sm text-ink-soft">
        We use these details to send the repair notice to the right place.
      </p>

      <Card className="mt-6">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <InputField
            id="address"
            label="Rental address"
            value={contact.address}
            onChange={(value) => onChange('address', value)}
            placeholder="e.g. 12/45 Smith Street, Fitzroy VIC 3065"
            autoComplete="street-address"
            required
            error={errors.address}
          />

          <InputField
            id="contactEmail"
            label="Contact email"
            type="email"
            value={contact.email}
            onChange={(value) => onChange('email', value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            error={errors.email}
          />

          {submitError && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Submit report'}
            </Button>
            <Button variant="secondary" onClick={onBack} disabled={submitting}>
              Back
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
