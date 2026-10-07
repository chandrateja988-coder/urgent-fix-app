import {
  controlClasses,
  errorClass,
  helpClass,
  labelClass,
} from './fieldStyles'

/**
 * InputField - label on top, single-line control underneath.
 * Used for every text / email / password / date input (screens 1, 2 and 3).
 */
export default function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helpText,
  error,
  required = false,
  autoComplete,
  max,
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

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        max={max}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId ?? helpId}
        className={controlClasses(error)}
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
