import '../../styles/toast.css'

type ToastType = 'error' | 'warning' | 'info'

const MAX_TOASTS = 3
const ICONS: Record<ToastType, string> = { error: '⚠', warning: '⚠', info: 'ℹ' }

let container: HTMLElement | null = null

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div')
    container.className = 'geo-toast-container'
    document.body.appendChild(container)
  }
  return container
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration = 5000
): void {
  const el = getContainer()

  // Enforce max toasts: remove oldest
  while (el.children.length >= MAX_TOASTS) {
    el.removeChild(el.children[0])
  }

  const toast = document.createElement('div')
  toast.className = `geo-toast geo-toast-${type}`
  toast.innerHTML =
    `<span class="geo-toast-icon">${ICONS[type]}</span>` +
    `<span class="geo-toast-message">${message}</span>`

  el.appendChild(toast)

  const timer = setTimeout(() => dismiss(toast), duration)

  toast.addEventListener('click', () => {
    clearTimeout(timer)
    dismiss(toast)
  })
}

function dismiss(toast: HTMLElement): void {
  if (!toast.parentNode) return
  toast.classList.add('geo-toast-exit')
  toast.addEventListener('animationend', () => toast.remove(), { once: true })
}
