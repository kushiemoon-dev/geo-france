import type maplibregl from 'maplibre-gl'
import { REGIONS, DEFAULT_REGION } from '../config/regions.ts'
import { loadRegion } from '../map/region-manager.ts'

export function setupRegionSelector(map: maplibregl.Map): void {
  const container = document.createElement('div')
  container.className = 'region-selector-panel'

  const title = document.createElement('h3')
  title.textContent = 'Region'
  container.appendChild(title)

  const select = document.createElement('select')
  select.className = 'region-select'

  for (const region of REGIONS) {
    const option = document.createElement('option')
    option.value = region.id
    option.textContent = region.name
    if (region.id === DEFAULT_REGION) {
      option.selected = true
    }
    select.appendChild(option)
  }

  select.addEventListener('change', () => {
    loadRegion(map, select.value)
  })

  container.appendChild(select)
  document.body.appendChild(container)
}
