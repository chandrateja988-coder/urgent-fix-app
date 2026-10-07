/**
 * AppHeader - slim app bar shown on every screen.
 * Displays the product name and, once inside the report flow, the current step.
 */
export default function AppHeader({ currentStep = null, signedInAs = null }) {
  return (
    <header className="border-b border-line/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            UF
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-ink">Urgent Fix</p>
            <p className="text-xs leading-tight text-ink-soft">
              Urgent repair reports for Victorian renters
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {currentStep !== null && (
            <p className="text-xs font-medium text-ink-soft">Step {currentStep} of 3</p>
          )}
          {signedInAs && (
            <p className="text-xs text-ink-soft/80">Signed in as {signedInAs}</p>
          )}
        </div>
      </div>
    </header>
  )
}
