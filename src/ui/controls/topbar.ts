import type maplibregl from 'maplibre-gl'
import { setMapMode } from '../../map/map-mode.ts'
import { bus } from '../../core/events.ts'
import { store } from '../../core/state.ts'
import { REGIONS } from '../../config/regions.ts'
import { loadRegion } from '../../map/region-manager.ts'
import type { MapMode } from '../../core/types.ts'
import { getTheme, toggleTheme } from '../theme.ts'

function createLogo(): HTMLElement {
  const logo = document.createElement('div')
  logo.className = 'topbar-logo'

  const icon = document.createElement('div')
  icon.className = 'topbar-logo-icon'
  icon.innerHTML = '&#9670;'

  const text = document.createElement('div')
  text.className = 'topbar-logo-text'

  const name = document.createElement('div')
  name.className = 'topbar-logo-name'
  name.textContent = 'GeoFrance'

  const sub = document.createElement('div')
  sub.className = 'topbar-logo-sub'
  sub.textContent = 'Carte géologique'

  text.appendChild(name)
  text.appendChild(sub)
  logo.appendChild(icon)
  logo.appendChild(text)

  return logo
}

function createRegionSelect(map: maplibregl.Map): HTMLElement {
  const select = document.createElement('select')
  select.className = 'geo-select topbar-region'
  select.setAttribute('aria-label', 'Région géologique')

  for (const region of REGIONS) {
    const option = document.createElement('option')
    option.value = region.id
    option.textContent = region.name
    if (region.id === store.getState().regionId) {
      option.selected = true
    }
    select.appendChild(option)
  }

  select.addEventListener('change', () => {
    loadRegion(map, select.value)
    document.dispatchEvent(new CustomEvent('regionchange', { detail: select.value }))
  })

  return select
}

function createModeToggle(map: maplibregl.Map): HTMLElement {
  const toggle = document.createElement('div')
  toggle.className = 'geo-toggle'

  const btnNational = document.createElement('button')
  btnNational.className = 'geo-toggle-item active'
  btnNational.textContent = 'Nationale'
  btnNational.type = 'button'

  const btnLocal = document.createElement('button')
  btnLocal.className = 'geo-toggle-item'
  btnLocal.textContent = 'Locale 1/50k'
  btnLocal.type = 'button'

  btnNational.addEventListener('click', () => setMapMode(map, 'national'))
  btnLocal.addEventListener('click', () => setMapMode(map, 'local'))

  bus.on('mode:change', ({ mode }: { mode: MapMode }) => {
    btnNational.className = mode === 'national' ? 'geo-toggle-item active' : 'geo-toggle-item'
    btnLocal.className = mode === 'local' ? 'geo-toggle-item active' : 'geo-toggle-item'
  })

  toggle.appendChild(btnNational)
  toggle.appendChild(btnLocal)

  return toggle
}

function createIconButton(icon: string, title: string, onClick: () => void): HTMLElement {
  const btn = document.createElement('button')
  btn.className = 'geo-btn geo-btn-icon'
  btn.innerHTML = icon
  btn.title = title
  btn.type = 'button'
  btn.addEventListener('click', onClick)
  return btn
}

function togglePanel(panelSel: string, btn: HTMLElement, exclusive?: { panelSel: string; btn: HTMLElement }): void {
  const panel = document.querySelector(panelSel)
  if (!panel) return
  const isOpen = panel.classList.toggle('panel-open')
  panel.classList.toggle('panel-closed', !isOpen)
  btn.setAttribute('aria-expanded', String(isOpen))
  if (isOpen && exclusive) {
    const other = document.querySelector(exclusive.panelSel)
    if (other) { other.classList.remove('panel-open'); other.classList.add('panel-closed') }
    exclusive.btn.setAttribute('aria-expanded', 'false')
  }
}

export function setupTopbar(map: maplibregl.Map): void {
  const bar = document.createElement('div')
  bar.className = 'topbar'

  const left = document.createElement('div')
  left.className = 'topbar-left'

  left.appendChild(createLogo())

  const sep = document.createElement('div')
  sep.className = 'topbar-separator'
  left.appendChild(sep)

  left.appendChild(createRegionSelect(map))
  left.appendChild(createModeToggle(map))

  const right = document.createElement('div')
  right.className = 'topbar-right'

  const layersBtn = createIconButton('&#9776;', 'Couches', () => togglePanel('.layer-toggle-panel', layersBtn))
  layersBtn.setAttribute('aria-expanded', 'false')
  layersBtn.setAttribute('aria-controls', 'layer-toggle-panel')

  const legendBtn = createIconButton('&#9673;', 'Légende', () => togglePanel('.legend-panel', legendBtn))
  legendBtn.setAttribute('aria-expanded', 'false')
  legendBtn.setAttribute('aria-controls', 'legend-panel')

  const themeBtn = document.createElement('button')
  themeBtn.className = 'geo-btn geo-btn-icon'
  themeBtn.type = 'button'
  themeBtn.title = 'Basculer thème clair/sombre'
  themeBtn.setAttribute('aria-label', 'Basculer thème clair/sombre')

  function updateThemeBtn(): void {
    themeBtn.innerHTML = getTheme() === 'dark' ? '&#9788;' : '&#9790;'
  }
  updateThemeBtn()
  themeBtn.addEventListener('click', () => {
    toggleTheme()
    updateThemeBtn()
  })

  right.appendChild(layersBtn)
  right.appendChild(legendBtn)
  right.appendChild(themeBtn)

  bar.appendChild(left)
  bar.appendChild(right)

  document.body.appendChild(bar)

  // Mobile FABs — separate from topbar to avoid stacking context issues
  const mobileFabs = document.createElement('div')
  mobileFabs.className = 'mobile-fabs'

  const mLayersBtn = createIconButton('&#9776;', 'Couches', () =>
    togglePanel('.layer-toggle-panel', mLayersBtn, { panelSel: '.legend-panel', btn: mLegendBtn })
  )
  mLayersBtn.setAttribute('aria-expanded', 'false')

  const mLegendBtn = createIconButton('&#9673;', 'Légende', () =>
    togglePanel('.legend-panel', mLegendBtn, { panelSel: '.layer-toggle-panel', btn: mLayersBtn })
  )
  mLegendBtn.setAttribute('aria-expanded', 'false')

  mobileFabs.appendChild(mLayersBtn)
  mobileFabs.appendChild(mLegendBtn)
  document.body.appendChild(mobileFabs)
}
