import type maplibregl from 'maplibre-gl'
import { bus } from '../core/events.ts'
import { store } from '../core/state.ts'
import { showToast } from '../ui/shared/toast.ts'
import type { MapMode } from '../core/types.ts'
import { REGIONS } from '../config/regions.ts'
import { getRegionLayerIds } from './styles.ts'

const DATA_REGIONS_CACHE = REGIONS.filter(r => r.id !== 'france')

function getAllRegionLayerIds(): string[] {
  return DATA_REGIONS_CACHE.flatMap(r => getRegionLayerIds(r.id))
}

const WMS_SOURCE_ID = 'brgm-wms'
const WMS_LAYER_ID = 'brgm-wms-layer'
const FILL_OPACITY = 0.65
export const LOCAL_MIN_ZOOM = 10

let wmsErrorHandled = false
let wmsErrorToastShown = false

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
      if (err.sourceId === WMS_SOURCE_ID && !wmsErrorToastShown) {
        wmsErrorToastShown = true
        showToast('Certaines tuiles WMS BRGM indisponibles', 'warning')
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

  const { regionId } = store.getState()
  const activeRegion = regionId !== 'france' ? regionId : DATA_REGIONS_CACHE[0]?.id
  const fillLayerId = activeRegion ? `geology-fill__${activeRegion}` : undefined
  const beforeId = fillLayerId && map.getLayer(fillLayerId) ? fillLayerId : undefined
  map.addLayer({
    id: WMS_LAYER_ID,
    type: 'raster',
    source: WMS_SOURCE_ID,
    paint: { 'raster-opacity': 0.7 }
  }, beforeId)
}

function hideWmsLayer(map: maplibregl.Map): void {
  if (map.getLayer(WMS_LAYER_ID)) {
    map.setLayoutProperty(WMS_LAYER_ID, 'visibility', 'none')
  }
}

function hideVectorLayers(map: maplibregl.Map): void {
  for (const layerId of getAllRegionLayerIds()) {
    if (!map.getLayer(layerId)) continue
    if (layerId.startsWith('geology-fill__')) {
      map.setPaintProperty(layerId, 'fill-opacity', 0)
    } else {
      map.setLayoutProperty(layerId, 'visibility', 'none')
    }
  }
}

function restoreVectorLayers(map: maplibregl.Map): void {
  const { layers, regionId } = store.getState()
  const activeRegionIds = regionId === 'france'
    ? DATA_REGIONS_CACHE.map(r => r.id)
    : (regionId ? [regionId] : [DATA_REGIONS_CACHE[0]?.id ?? ''])

  for (const layerId of getAllRegionLayerIds()) {
    if (!map.getLayer(layerId)) continue
    const belongsToActive = activeRegionIds.some(rid => layerId.endsWith(`__${rid}`))
    if (!belongsToActive) continue

    if (layerId.startsWith('geology-fill__')) {
      // geology-fill uses fill-opacity for visibility control (never layout visibility)
      // to stay consistent with hideVectorLayers and toggleLayerGroup
      const fillVisible = layers['geology-fill'] ?? true
      map.setPaintProperty(layerId, 'fill-opacity', fillVisible ? FILL_OPACITY : 0)
      map.setLayoutProperty(layerId, 'visibility', 'visible')
      continue
    }

    const baseId = layerId.split('__')[0]
    const visible = layers[baseId] ?? true
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
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
