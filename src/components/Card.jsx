/**
 * Card - white rounded container with padding and a subtle shadow.
 * Used to group the content on screens 2, 3 and 4.
 */
export default function Card({ title, subtitle, children, footer, className = '' }) {
  const classes = [
    'rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      {(title || subtitle) && (
        <header className="mb-6">
          {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </header>
      )}

      {children}

      {footer && <div className="mt-8">{footer}</div>}
    </section>
  )
}
