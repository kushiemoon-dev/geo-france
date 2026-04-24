import type maplibregl from 'maplibre-gl'
import { ALL_LAYERS } from './styles.ts'
import { getRegion } from '../config/regions.ts'
import { ensureModeAfterRegionLoad } from './map-mode.ts'
import { showMapLoading, hideMapLoading } from '../ui/shared/loading.ts'
import { showToast } from '../ui/shared/toast.ts'
import { store } from '../core/state.ts'
import { bus } from '../core/events.ts'

let currentRegionId: string | null = null

function removeGeologyLayers(map: maplibregl.Map): void {
  const reversed = [...ALL_LAYERS].reverse()
  for (const layer of reversed) {
    if (map.getLayer(layer.id)) {
      map.removeLayer(layer.id)
    }
  }
}

function removeGeologySource(map: maplibregl.Map): void {
  if (map.getSource('geology')) {
    map.removeSource('geology')
  }
}

function addGeologySource(map: maplibregl.Map, regionId: string): void {
  map.addSource('geology', {
    type: 'vector',
    url: `pmtiles:///data/${regionId}.pmtiles`
  })
}

function addGeologyLayers(map: maplibregl.Map): void {
  for (const layer of ALL_LAYERS) {
    map.addLayer(layer)
  }
}

export function loadRegion(map: maplibregl.Map, regionId: string): void {
  const region = getRegion(regionId)
  if (!region) {
    showToast(`Region inconnue : ${regionId}`, 'error')
    return
  }

  if (regionId === currentRegionId) return

  if (regionId === 'france') {
    removeGeologyLayers(map)
    removeGeologySource(map)
    currentRegionId = regionId
    store.setState({ regionId, loading: false })
    map.fitBounds(region.bounds, { padding: 40, duration: 1000 })
    bus.emit('region:loaded', { regionId })
    return
  }

  store.setState({ loading: true })
  showMapLoading(`Chargement ${region.name}...`)

  removeGeologyLayers(map)
  removeGeologySource(map)

  addGeologySource(map, regionId)
  addGeologyLayers(map)
  ensureModeAfterRegionLoad(map)

  currentRegionId = regionId
  store.setState({ regionId })

  const cleanup = () => {
    map.off('sourcedata', onSourceData)
    map.off('error', onSourceError)
    clearTimeout(loadTimeout)
  }

  const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId === 'geology' && e.isSourceLoaded) {
      cleanup()
      hideMapLoading()
      store.setState({ loading: false })
      bus.emit('region:loaded', { regionId })
    }
  }

  const onSourceError = (e: { sourceId?: string; error?: { message?: string } }) => {
    if (e.sourceId !== 'geology') return
    cleanup()
    hideMapLoading()
    store.setState({ loading: false })
    showToast(`Données indisponibles pour ${region.name}`, 'warning')
  }

  const loadTimeout = setTimeout(() => {
    cleanup()
    hideMapLoading()
    store.setState({ loading: false })
    showToast(`Chargement ${region.name} trop long — données peut-être absentes`, 'warning')
  }, 15000)

  map.on('sourcedata', onSourceData)
  map.on('error', onSourceError as Parameters<typeof map.on>[1])

  map.fitBounds(region.bounds, { padding: 40, duration: 1000 })
}

export function getCurrentRegionId(): string | null {
  return currentRegionId
}

export function loadInitialRegion(map: maplibregl.Map, regionId: string): void {
  loadRegion(map, regionId)
}
