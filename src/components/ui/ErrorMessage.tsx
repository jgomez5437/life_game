// src/components/ui/ErrorMessage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Replaces: window.UI.showModal("Wait", error) for inline validation feedback.
//
// WHY NOT A MODAL?
//   The old code used a full blocking modal overlay just to say "name is too
//   short." That's heavy UX for a simple inline validation failure.
//   An inline error that appears beneath the field is the modern standard
//   (used by every major form library: react-hook-form, Formik, etc.)
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorMessageProps {
  message: string | null;
}

/**
 * Renders a styled inline error message below form fields.
 * Returns null (renders nothing) when message is null — no ternary needed at call sites.
 *
 * Usage:
 *   <ErrorMessage message={error} />
 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-2 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 animate-pulse-once"
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
