import * as Sentry from '@sentry/browser'

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Capture 10% of sessions for performance (free tier friendly)
    tracesSampleRate: 0.1,
    // Ignore non-actionable noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  })
}

export function initPlausible(): void {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined
  if (!domain) return

  const script = document.createElement('script')
  script.defer = true
  script.dataset['domain'] = domain
  script.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(script)
}
