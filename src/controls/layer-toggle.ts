import type maplibregl from 'maplibre-gl'
import { bus } from '../core/events.ts'
import { store } from '../core/state.ts'
import { DATA_REGIONS } from '../map/region-manager.ts'

interface LayerGroup {
  readonly id: string
  readonly label: string
  readonly baseLayerIds: readonly string[]
  visible: boolean
}

const LAYER_GROUPS: LayerGroup[] = [
  { id: 'formations', label: 'Formations géologiques', baseLayerIds: ['geology-fill', 'geology-highlight'], visible: true },
  { id: 'contours', label: 'Contours formations', baseLayerIds: ['geology-outline'], visible: true },
  { id: 'faults', label: 'Failles & contacts', baseLayerIds: ['faults-major', 'faults-minor'], visible: true },
  { id: 'dips', label: 'Pendages', baseLayerIds: ['dip-points', 'dip-labels'], visible: true },
  { id: 'surcharge', label: 'Surcharges', baseLayerIds: ['surcharge'], visible: true },
]

function getActiveRegionIds(): string[] {
  const { regionId } = store.getState()
  return regionId === 'france'
    ? DATA_REGIONS.map(r => r.id)
    : (regionId ? [regionId] : [DATA_REGIONS[0]?.id ?? ''])
}

function toggleLayerGroup(map: maplibregl.Map, group: LayerGroup): void {
  const visibility = group.visible ? 'visible' : 'none'
  const layerUpdates: Record<string, boolean> = {}

  for (const baseId of group.baseLayerIds) {
    for (const regionId of getActiveRegionIds()) {
      const layerId = `${baseId}__${regionId}`
      if (map.getLayer(layerId)) {
        if (baseId === 'geology-fill') {
          map.setPaintProperty(layerId, 'fill-opacity', group.visible ? 0.65 : 0)
        } else {
          map.setLayoutProperty(layerId, 'visibility', visibility)
        }
      }
    }
    layerUpdates[baseId] = group.visible
  }

  store.setState({ layers: { ...store.getState().layers, ...layerUpdates } })
}

export function setupLayerToggle(map: maplibregl.Map): void {
  const container = document.createElement('div')
  container.className = 'layer-toggle-panel'

  const title = document.createElement('h3')
  title.textContent = 'Couches'
  container.appendChild(title)

  for (const group of LAYER_GROUPS) {
    const label = document.createElement('label')
    label.className = 'layer-toggle-item'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = group.visible

    checkbox.addEventListener('change', () => {
      group.visible = checkbox.checked
      toggleLayerGroup(map, group)
    })

    const span = document.createElement('span')
    span.textContent = group.label

    label.appendChild(checkbox)
    label.appendChild(span)
    container.appendChild(label)
  }

  const updateVisibility = (mode: string): void => {
    container.style.display = mode === 'national' ? 'block' : 'none'
  }

  updateVisibility(store.getState().mode)
  bus.on('mode:change', ({ mode }) => updateVisibility(mode))

  document.body.appendChild(container)
}
