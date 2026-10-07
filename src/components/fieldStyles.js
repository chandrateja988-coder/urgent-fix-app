/**
 * Shared Tailwind class strings for form controls.
 *
 * Kept in one place so InputField, TextAreaField and FileField always render
 * with identical borders, padding, focus rings and error styling.
 */

/** Label sitting above a control. */
export const labelClass = 'mb-1.5 block text-sm font-medium text-ink'

/** Base styling for every control (input, textarea, file input). */
export const controlClass = [
  'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink shadow-sm',
  'placeholder:text-ink-soft/70 transition',
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25',
  'disabled:cursor-not-allowed disabled:bg-canvas',
].join(' ')

/** Extra styling applied when a control is invalid. */
export const controlErrorClass =
  'border-red-400 focus:border-red-500 focus:ring-red-200'

/** Styling for the small helper line under a control. */
export const helpClass = 'mt-1.5 text-xs text-ink-soft'

/** Styling for the small validation message under a control. */
export const errorClass = 'mt-1.5 text-xs font-medium text-red-600'

/** Builds the final class string for a control. */
export function controlClasses(error) {
  return error ? `${controlClass} ${controlErrorClass}` : controlClass
}
