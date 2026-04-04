import type maplibregl from 'maplibre-gl'
import { ALL_LAYERS } from './styles.ts'
import { bus } from '../core/events.ts'
import { store } from '../core/state.ts'
import { showToast } from '../ui/shared/toast.ts'
import type { MapMode } from '../core/types.ts'

const WMS_SOURCE_ID = 'brgm-wms'
const WMS_LAYER_ID = 'brgm-wms-layer'
const FILL_OPACITY = 0.65
const LOCAL_MIN_ZOOM = 10

let wmsErrorHandled = false

function ensureWmsSource(map: maplibregl.Map): void {
  if (map.getSource(WMS_SOURCE_ID)) return

  map.addSource(WMS_SOURCE_ID, {
    type: 'raster',
    tiles: [
      'https://geoservices.brgm.fr/geologie?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=SCAN_H_GEOL50&SRS=EPSG:3857&FORMAT=image/png&TRANSPARENT=true&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'
    ],
    tileSize: 256,
    minzoom: LOCAL_MIN_ZOOM,
    attribution: '&copy; BRGM'
  })

  if (!wmsErrorHandled) {
    map.on('error', (e: unknown) => {
      const err = e as { sourceId?: string }
      if (err.sourceId === WMS_SOURCE_ID) {
        showToast('Erreur de chargement WMS BRGM', 'warning')
      }
    })
    wmsErrorHandled = true
  }
}

function showWmsLayer(map: maplibregl.Map): void {
  ensureWmsSource(map)

  if (map.getLayer(WMS_LAYER_ID)) {
    map.setLayoutProperty(WMS_LAYER_ID, 'visibility', 'visible')
    return
  }

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
      if (layer.id === 'geology-fill') {
        map.setPaintProperty(layer.id, 'fill-opacity', 0)
      } else {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
    }
  }
}

function restoreVectorLayers(map: maplibregl.Map): void {
  const { layers } = store.getState()

  for (const layer of ALL_LAYERS) {
    if (map.getLayer(layer.id)) {
      if (layer.id === 'geology-fill') {
        map.setPaintProperty(layer.id, 'fill-opacity', FILL_OPACITY)
      }
      const visible = layers[layer.id] ?? true
      map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none')
    }
  }
}

export function setMapMode(map: maplibregl.Map, mode: MapMode): void {
  if (mode === store.getState().mode) return

  store.setState({ mode })

  if (mode === 'local') {
    hideVectorLayers(map)
    showWmsLayer(map)
    if (map.getZoom() < LOCAL_MIN_ZOOM) {
      map.easeTo({ zoom: LOCAL_MIN_ZOOM, duration: 800 })
      showToast('Zoom automatique pour la vue locale', 'info')
    }
  } else {
    hideWmsLayer(map)
    restoreVectorLayers(map)
  }

  bus.emit('mode:change', { mode })
}

export function ensureModeAfterRegionLoad(map: maplibregl.Map): void {
  if (store.getState().mode === 'local') {
    hideVectorLayers(map)
    showWmsLayer(map)
  }
}
