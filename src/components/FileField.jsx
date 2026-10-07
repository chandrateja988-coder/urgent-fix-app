import { controlClasses, helpClass, labelClass } from './fieldStyles'

/**
 * FileField - "Add a photo" control.
 *
 * Uses the same border / padding / focus styling as InputField and reports the
 * chosen file back to the parent screen as a File object (or null when cleared).
 */
export default function FileField({
  id,
  label,
  accept = 'image/*',
  fileName,
  onSelect,
  helpText,
  className = '',
}) {
  const helpId = helpText ? `${id}-help` : undefined

  const fileInputClass = [
    controlClasses(false),
    'cursor-pointer p-2 text-sm',
    'file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand-soft',
    'file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand',
  ].join(' ')

  return (
    <div className={className}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        name={id}
        type="file"
        accept={accept}
        aria-describedby={helpId}
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        className={fileInputClass}
      />

      {fileName && (
        <p className="mt-1.5 text-xs font-medium text-brand">
          Attached: {fileName}
        </p>
      )}

      {helpText && (
        <p className={helpClass} id={helpId}>
          {helpText}
        </p>
      )}
    </div>
  )
}
