import type maplibregl from 'maplibre-gl'
import { bus } from '../core/events.ts'
import { store } from '../core/state.ts'

interface LayerGroup {
  readonly id: string
  readonly label: string
  readonly layerIds: readonly string[]
  visible: boolean
}

const LAYER_GROUPS: LayerGroup[] = [
  { id: 'formations', label: 'Formations géologiques', layerIds: ['geology-fill', 'geology-highlight'], visible: true },
  { id: 'contours', label: 'Contours formations', layerIds: ['geology-outline'], visible: true },
  { id: 'faults', label: 'Failles & contacts', layerIds: ['faults'], visible: true },
  { id: 'dips', label: 'Pendages', layerIds: ['dip-points', 'dip-labels'], visible: true },
  { id: 'surcharge', label: 'Surcharges', layerIds: ['surcharge'], visible: true },
]

function toggleLayerGroup(map: maplibregl.Map, group: LayerGroup): void {
  const visibility = group.visible ? 'visible' : 'none'
  const layerUpdates: Record<string, boolean> = {}

  for (const layerId of group.layerIds) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility)
    }
    layerUpdates[layerId] = group.visible
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

  bus.on('mode:change', ({ mode }) => {
    const isLocal = mode === 'local'
    container.style.opacity = isLocal ? '0.5' : '1'
    container.style.pointerEvents = isLocal ? 'none' : ''
  })

  document.body.appendChild(container)
}
