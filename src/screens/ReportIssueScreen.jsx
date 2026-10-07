import { useState } from 'react'

import Button from '../components/Button'
import Card from '../components/Card'
import FileField from '../components/FileField'
import InputField from '../components/InputField'
import TextAreaField from '../components/TextAreaField'

/**
 * Screen 2 - Report an issue.
 * Collects the problem description, the date it was first noticed and an
 * optional photo of the damage.
 */
export default function ReportIssueScreen({
  report,
  onChange,
  onContinue,
  onBack,
  onViewReports,
}) {
  const [errors, setErrors] = useState({})
  const today = new Date().toISOString().slice(0, 10)

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!report.description.trim()) {
      nextErrors.description = 'Tell us briefly what needs fixing.'
    }

    if (!report.noticedOn) {
      nextErrors.noticedOn = 'Choose the date you first noticed the problem.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onContinue()
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold text-ink">Report an issue</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Tell your rental provider what has broken and when you noticed it.
      </p>

      <Card className="mt-6">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <TextAreaField
            id="description"
            label="Describe the problem"
            value={report.description}
            onChange={(value) => onChange('description', value)}
            placeholder="e.g. The kitchen tap is leaking and water is pooling under the cupboard."
            rows={5}
            required
            error={errors.description}
          />

          <InputField
            id="noticedOn"
            label="When did you first notice it"
            type="date"
            value={report.noticedOn}
            onChange={(value) => onChange('noticedOn', value)}
            max={today}
            required
            error={errors.noticedOn}
          />

          <FileField
            id="photo"
            label="Add a photo"
            accept="image/*"
            fileName={report.photo?.name ?? ''}
            onSelect={(file) => onChange('photo', file)}
            helpText="Optional — a photo helps your provider assess the repair faster."
          />

          <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
            <Button type="submit">Continue</Button>
            <Button variant="secondary" onClick={onBack}>
              Back to login
            </Button>
          </div>
        </form>
      </Card>

      {onViewReports && (
        <p className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={onViewReports}
            className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
          >
            View my saved reports
          </button>
        </p>
      )}
    </div>
  )
}
