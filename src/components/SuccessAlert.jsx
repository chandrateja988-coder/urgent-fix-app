import { CircleCheckIcon } from 'lucide-react'

/**
 * SuccessAlert - rounded, bordered success box with a checkmark icon, a bold
 * title and a description underneath.
 *
 * Plain JSX + Tailwind utility classes (no TypeScript, no shadcn). Colours come
 * from the `success` token group in src/index.css, so the green stays distinct
 * from the teal `brand` colour used for buttons and headers.
 *
 * Props:
 *   title       - bold heading text (required)
 *   description - short supporting line under the title
 *   titleAs     - heading element to render for the title (default "h2")
 *   children    - optional extra content under the description
 */
export default function SuccessAlert({
  title,
  description,
  titleAs: TitleTag = 'h2',
  children,
  className = '',
}) {
  const classes = [
    'flex items-start gap-3 rounded-xl border border-success-line bg-success-soft p-4',
    'sm:gap-4 sm:p-5',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="status">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-success ring-1 ring-success-line">
        <CircleCheckIcon className="h-6 w-6" aria-hidden="true" />
      </span>

      <div className="min-w-0">
        <TitleTag className="text-base font-semibold text-success-ink">
          {title}
        </TitleTag>

        {description && (
          <p className="mt-1 text-sm text-success-ink/80">{description}</p>
        )}

        {children}
      </div>
    </div>
  )
}
