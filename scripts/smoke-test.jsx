/**
 * Render smoke test for the Urgent Fix demo.
 *
 * Renders each screen with react-dom/server and asserts that the expected
 * content appears. Run with: npm run test:smoke
 */
import { renderToStaticMarkup } from 'react-dom/server'

import App from '../src/App.jsx'
import SuccessAlert from '../src/components/SuccessAlert.jsx'
import MyReportsScreen from '../src/screens/MyReportsScreen.jsx'
import ConfirmationScreen from '../src/screens/ConfirmationScreen.jsx'
import PropertyDetailsScreen from '../src/screens/PropertyDetailsScreen.jsx'
import ReportIssueScreen from '../src/screens/ReportIssueScreen.jsx'

const results = []

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail })
}

function includes(name, html, text) {
  check(name, html.includes(text), `expected markup to contain "${text}"`)
}

const report = {
  description: 'Kitchen tap is leaking',
  noticedOn: '2026-03-04',
  photo: { name: 'leak.jpg', size: 1450000 },
}

const contact = {
  address: '12/45 Smith Street, Fitzroy VIC 3065',
  email: 'renter@example.com',
}

// Screen 1 - Login (the screen App renders first)
const appHtml = renderToStaticMarkup(<App />)
includes('App boots on the login screen', appHtml, 'Log in')
includes('Login screen has an email field', appHtml, 'type="email"')
includes('Login screen has a password field', appHtml, 'type="password"')
includes('Login screen renders the primary Button', appHtml, 'bg-brand')
includes('Login screen renders a Card', appHtml, 'rounded-xl')

// Screen 2 - Report an issue
const reportHtml = renderToStaticMarkup(
  <ReportIssueScreen
    report={report}
    onChange={() => {}}
    onContinue={() => {}}
    onBack={() => {}}
  />,
)
includes('Report screen shows the description', reportHtml, 'Kitchen tap is leaking')
includes('Report screen uses a date input', reportHtml, 'type="date"')
includes('Report screen uses a file input', reportHtml, 'type="file"')
includes('Report screen shows the attached file name', reportHtml, 'Attached: leak.jpg')
includes('Report screen has a Continue button', reportHtml, 'Continue')

// Screen 3 - Property & contact details
const detailsHtml = renderToStaticMarkup(
  <PropertyDetailsScreen
    contact={contact}
    onChange={() => {}}
    onSubmit={() => {}}
    onBack={() => {}}
  />,
)
includes('Details screen shows the rental address', detailsHtml, contact.address)
includes('Details screen shows the contact email', detailsHtml, contact.email)
includes('Details screen has a Submit report button', detailsHtml, 'Submit report')

// Screen 4 - Confirmation
const confirmationHtml = renderToStaticMarkup(
  <ConfirmationScreen report={report} contact={contact} onDone={() => {}} />,
)
includes(
  'Confirmation shows the success title',
  confirmationHtml,
  'Report submitted successfully',
)
includes(
  'Confirmation shows the success description',
  confirmationHtml,
  'Your repair report has been recorded',
)
includes(
  'Confirmation uses the success alert styling',
  confirmationHtml,
  'bg-success-soft',
)
includes(
  'Confirmation success alert has a bordered box',
  confirmationHtml,
  'border-success-line',
)
includes(
  'Confirmation success alert renders the lucide check icon',
  confirmationHtml,
  'lucide-circle-check',
)
check(
  'Confirmation success alert renders an svg icon',
  confirmationHtml.includes('<svg'),
  'expected an <svg> element in the alert',
)
includes('Confirmation summarises the description', confirmationHtml, 'Kitchen tap is leaking')
includes('Confirmation formats the date', confirmationHtml, '4 March 2026')
includes('Confirmation formats the photo size', confirmationHtml, '1.4 MB')
check(
  'Photo summary joins file name and size with an em dash',
  confirmationHtml.includes('leak.jpg \u2014 1.4 MB'),
  'expected "leak.jpg — 1.4 MB"',
)
includes('Confirmation summarises the address', confirmationHtml, contact.address)
includes('Confirmation summarises the contact email', confirmationHtml, contact.email)
includes('Confirmation has a Done button', confirmationHtml, 'Done')

// SuccessAlert component in isolation (used standalone and with a custom title tag)
const alertHtml = renderToStaticMarkup(
  <SuccessAlert
    title="Report submitted successfully"
    description="Your repair report has been recorded."
    titleAs="h1"
  />,
)
includes('SuccessAlert renders its title', alertHtml, 'Report submitted successfully')
includes('SuccessAlert renders its description', alertHtml, 'Your repair report has been recorded.')
includes('SuccessAlert renders the title as h1 when asked', alertHtml, '<h1')
includes('SuccessAlert is announced to assistive tech', alertHtml, 'role="status"')

const alertWithoutDescriptionHtml = renderToStaticMarkup(<SuccessAlert title="Saved" />)
includes('SuccessAlert works without a description', alertWithoutDescriptionHtml, 'Saved')
check(
  'SuccessAlert omits the description paragraph when none is given',
  !alertWithoutDescriptionHtml.includes('<p '),
  'expected no <p> element',
)
check(
  'SuccessAlert defaults its title to an h2',
  alertWithoutDescriptionHtml.includes('<h2'),
  'expected an <h2> element',
)

// Saving state on the details screen (React -> Python API -> Supabase)
const savingHtml = renderToStaticMarkup(
  <PropertyDetailsScreen
    contact={contact}
    onChange={() => {}}
    onSubmit={() => {}}
    onBack={() => {}}
    submitting
    submitError="We could not save your report. Please try again."
  />,
)
includes('Details screen shows a saving label while submitting', savingHtml, 'Saving…')
includes('Details screen shows a save error', savingHtml, 'We could not save your report')
check('Submit button is disabled while saving', savingHtml.includes('disabled=""'), 'expected a disabled button')

// Confirmation shows the database reference when one is passed in
const referenceHtml = renderToStaticMarkup(
  <ConfirmationScreen
    report={report}
    contact={contact}
    reference="1A2B3C4D"
    onDone={() => {}}
    onViewReports={() => {}}
  />,
)
includes('Confirmation shows the database reference', referenceHtml, '1A2B3C4D')
includes('Confirmation links to saved reports', referenceHtml, 'View my reports')

// Report screen link to saved reports
const reportLinkHtml = renderToStaticMarkup(
  <ReportIssueScreen
    report={report}
    onChange={() => {}}
    onContinue={() => {}}
    onBack={() => {}}
    onViewReports={() => {}}
  />,
)
includes('Report screen links to saved reports', reportLinkHtml, 'View my saved reports')

// My reports screen (the data itself loads in the browser, so SSR shows the loading state)
const myReportsHtml = renderToStaticMarkup(
  <MyReportsScreen email="renter@example.com" onNewReport={() => {}} />,
)
includes('My reports screen has a heading', myReportsHtml, 'My reports')
includes('My reports screen shows the signed-in email', myReportsHtml, 'renter@example.com')
includes('My reports screen starts in the loading state', myReportsHtml, 'Loading your reports')

const failed = results.filter((result) => !result.ok)

for (const result of results) {
  console.log(
    `${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.ok ? '' : ` -> ${result.detail}`}`,
  )
}

console.log(`\n${results.length - failed.length}/${results.length} checks passed`)

if (failed.length > 0) {
  process.exitCode = 1
}
