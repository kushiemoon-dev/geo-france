import type maplibregl from 'maplibre-gl'

interface LayerGroup {
  id: string
  label: string
  layerIds: string[]
  visible: boolean
}

const LAYER_GROUPS: LayerGroup[] = [
  { id: 'formations', label: 'Formations geologiques', layerIds: ['geology-fill', 'geology-highlight'], visible: true },
  { id: 'contours', label: 'Contours formations', layerIds: ['geology-outline'], visible: true },
  { id: 'faults', label: 'Failles & contacts', layerIds: ['faults'], visible: true },
  { id: 'dips', label: 'Pendages', layerIds: ['dip-points', 'dip-labels'], visible: true },
  { id: 'surcharge', label: 'Surcharges', layerIds: ['surcharge'], visible: true },
]

function toggleLayerGroup(map: maplibregl.Map, group: LayerGroup): void {
  const visibility = group.visible ? 'visible' : 'none'
  for (const layerId of group.layerIds) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility)
    }
  }
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

  document.body.appendChild(container)
}
