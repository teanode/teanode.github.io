// A global this code reaches for that is not part of the DOM.

interface Window {
  // The gtag snippet in index.html defines this. components/analytics.tsx
  // checks for it before calling, because an ad blocker is a normal outcome.
  gtag?: (command: string, event: string, parameters?: Record<string, unknown>) => void
}
