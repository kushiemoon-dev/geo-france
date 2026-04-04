import type maplibregl from 'maplibre-gl'
import { setMapMode } from '../map/map-mode.ts'
import { bus } from '../core/events.ts'
import type { MapMode } from '../core/types.ts'

export function setupModeToggle(map: maplibregl.Map): void {
  const container = document.createElement('div')
  container.className = 'mode-toggle-panel'

  const title = document.createElement('h3')
  title.textContent = 'Vue'
  container.appendChild(title)

  const btnGroup = document.createElement('div')
  btnGroup.className = 'mode-btn-group'

  const btnNational = document.createElement('button')
  btnNational.className = 'mode-btn mode-btn-active'
  btnNational.textContent = 'Nationale'
  btnNational.type = 'button'

  const btnLocal = document.createElement('button')
  btnLocal.className = 'mode-btn'
  btnLocal.textContent = 'Locale 1/50 000'
  btnLocal.type = 'button'

  btnNational.addEventListener('click', () => setMapMode(map, 'national'))
  btnLocal.addEventListener('click', () => setMapMode(map, 'local'))

  btnGroup.appendChild(btnNational)
  btnGroup.appendChild(btnLocal)
  container.appendChild(btnGroup)

  bus.on('mode:change', ({ mode }: { mode: MapMode }) => {
    btnNational.className = mode === 'national' ? 'mode-btn mode-btn-active' : 'mode-btn'
    btnLocal.className = mode === 'local' ? 'mode-btn mode-btn-active' : 'mode-btn'
  })

  document.body.appendChild(container)
}
