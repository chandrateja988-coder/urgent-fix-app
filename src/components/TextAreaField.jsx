import {
  controlClasses,
  errorClass,
  helpClass,
  labelClass,
} from './fieldStyles'

/**
 * TextAreaField - identical label / border / focus styling to InputField,
 * but renders a multi-line control (used for "Describe the problem").
 */
export default function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  helpText,
  error,
  required = false,
  className = '',
}) {
  const helpId = helpText ? `${id}-help` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={className}>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required && (
          <span className="text-brand" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>

      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId ?? helpId}
        className={`${controlClasses(error)} resize-y leading-relaxed`}
      />

      {error && (
        <p className={errorClass} id={errorId}>
          {error}
        </p>
      )}

      {!error && helpText && (
        <p className={helpClass} id={helpId}>
          {helpText}
        </p>
      )}
    </div>
  )
}
