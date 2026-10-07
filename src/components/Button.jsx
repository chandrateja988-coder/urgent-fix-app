/**
 * Button - the single button used across every screen.
 *
 * Primary style (default): deep teal background, white text, rounded corners.
 */

const VARIANT_CLASSES = {
  primary:
    'bg-brand text-white shadow-sm hover:bg-brand-dark focus-visible:outline-brand',
  secondary:
    'border border-brand/30 bg-white text-brand hover:bg-brand-soft focus-visible:outline-brand',
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  fullWidth = true,
  disabled = false,
  onClick,
  className = '',
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold',
    'transition focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}
