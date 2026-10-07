import Button from '../components/Button'
import Card from '../components/Card'
import SuccessAlert from '../components/SuccessAlert'
import { formatDateForSummary, formatFileSize } from '../utils/formatters'

/** One row of the submitted-report summary. */
function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line/60 py-3 last:border-b-0 sm:flex-row sm:gap-6">
      <dt className="w-44 shrink-0 text-sm font-medium text-ink-soft">{label}</dt>
      <dd className="text-sm break-words whitespace-pre-line text-ink">{value}</dd>
    </div>
  )
}

/**
 * Screen 4 - Confirmation.
 * Success message plus a summary of what was entered on screens 2 and 3.
 */
export default function ConfirmationScreen({
  report,
  contact,
  reference = '',
  onDone,
  onViewReports,
}) {
  const photoLine = report.photo
    ? [report.photo.name, formatFileSize(report.photo.size)]
        .filter(Boolean)
        .join(' — ')
    : 'No photo added'

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card>
        <SuccessAlert
          titleAs="h1"
          title="Report submitted successfully"
          description="Your repair report has been recorded and saved to the database. Keep this summary for your own records."
        />

        <dl className="mt-6 rounded-lg bg-canvas px-4 py-2 sm:px-6">
          {reference && <SummaryRow label="Reference" value={reference} />}
          <SummaryRow label="Problem description" value={report.description} />
          <SummaryRow
            label="First noticed"
            value={formatDateForSummary(report.noticedOn)}
          />
          <SummaryRow label="Photo" value={photoLine} />
          <SummaryRow label="Rental address" value={contact.address} />
          <SummaryRow label="Contact email" value={contact.email} />
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
          <Button onClick={onDone}>Done</Button>
          {onViewReports && (
            <Button variant="secondary" onClick={onViewReports}>
              View my reports
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-ink-soft">
        Your report is saved in the Urgent Fix database. This is a demo — nothing was sent to your provider.
      </p>
    </div>
  )
}
