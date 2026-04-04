import type maplibregl from 'maplibre-gl'
import { ALL_LAYERS } from './styles.ts'

export type MapMode = 'national' | 'local'

const WMS_SOURCE_ID = 'brgm-wms'
const WMS_LAYER_ID = 'brgm-wms-layer'

let currentMode: MapMode = 'national'

// Callback to get layer visibility states from layer-toggle
let getLayerStates: (() => Record<string, boolean>) | null = null

export function registerLayerStatesGetter(fn: () => Record<string, boolean>): void {
  getLayerStates = fn
}

export function getCurrentMode(): MapMode {
  return currentMode
}

function ensureWmsSource(map: maplibregl.Map): void {
  if (map.getSource(WMS_SOURCE_ID)) return

  map.addSource(WMS_SOURCE_ID, {
    type: 'raster',
    tiles: [
      'https://geoservices.brgm.fr/geologie?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=SCAN_H_GEOL50&SRS=EPSG:3857&FORMAT=image/png&TRANSPARENT=true&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'
    ],
    tileSize: 256,
    attribution: '&copy; BRGM'
  })
}

function showWmsLayer(map: maplibregl.Map): void {
  ensureWmsSource(map)

  if (map.getLayer(WMS_LAYER_ID)) {
    map.setLayoutProperty(WMS_LAYER_ID, 'visibility', 'visible')
    return
  }

  // Insert above basemaps but works even if geology-fill is hidden
  const beforeId = map.getLayer('geology-fill') ? 'geology-fill' : undefined
  map.addLayer({
    id: WMS_LAYER_ID,
    type: 'raster',
    source: WMS_SOURCE_ID,
    paint: { 'raster-opacity': 0.85 }
  }, beforeId)
}

function hideWmsLayer(map: maplibregl.Map): void {
  if (map.getLayer(WMS_LAYER_ID)) {
    map.setLayoutProperty(WMS_LAYER_ID, 'visibility', 'none')
  }
}

function hideVectorLayers(map: maplibregl.Map): void {
  for (const layer of ALL_LAYERS) {
    if (map.getLayer(layer.id)) {
      // Keep geology-fill queryable by making it transparent instead of hidden
      if (layer.id === 'geology-fill') {
        map.setPaintProperty(layer.id, 'fill-opacity', 0)
      } else {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
    }
  }
}

function restoreVectorLayers(map: maplibregl.Map): void {
  const states = getLayerStates ? getLayerStates() : {}

  for (const layer of ALL_LAYERS) {
    if (map.getLayer(layer.id)) {
      if (layer.id === 'geology-fill') {
        map.setPaintProperty(layer.id, 'fill-opacity', 0.65)
      }
      const visible = states[layer.id] ?? true
      map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none')
    }
  }
}

export function setMapMode(map: maplibregl.Map, mode: MapMode): void {
  if (mode === currentMode) return

  currentMode = mode

  if (mode === 'local') {
    hideVectorLayers(map)
    showWmsLayer(map)
  } else {
    hideWmsLayer(map)
    restoreVectorLayers(map)
  }

  document.dispatchEvent(new CustomEvent('mapmodechange', { detail: { mode } }))
}

export function ensureModeAfterRegionLoad(map: maplibregl.Map): void {
  if (currentMode === 'local') {
    hideVectorLayers(map)
    showWmsLayer(map)
  }
}
