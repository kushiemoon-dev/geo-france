import '../../styles/loading.css'

const MAP_LOADING_ID = 'geo-map-loading'

export function createSpinner(size = 24): HTMLElement {
  const el = document.createElement('div')
  el.className = 'geo-spinner'
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  return el
}

export function createLoadingBar(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'geo-loading-bar'

  const fill = document.createElement('div')
  fill.className = 'geo-loading-bar-fill'
  bar.appendChild(fill)

  return bar
}

export function showMapLoading(message = 'Chargement...'): void {
  if (document.getElementById(MAP_LOADING_ID)) return

  const container = document.createElement('div')
  container.id = MAP_LOADING_ID
  container.className = 'geo-map-loading'

  container.appendChild(createSpinner(20))

  const text = document.createElement('span')
  text.className = 'geo-map-loading-text'
  text.textContent = message
  container.appendChild(text)

  const mapEl = document.getElementById('map')
  if (mapEl) {
    mapEl.appendChild(container)
  }
}

export function hideMapLoading(): void {
  document.getElementById(MAP_LOADING_ID)?.remove()
}
