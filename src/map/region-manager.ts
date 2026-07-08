import type maplibregl from 'maplibre-gl'
import { REGIONS, getRegion } from '../config/regions.ts'
import { createLayersForRegion, getRegionLayerIds, createNationalLayers, NATIONAL_LAYER_IDS } from './styles.ts'
import { ensureModeAfterRegionLoad } from './map-mode.ts'
import { showMapLoading, hideMapLoading } from '../ui/shared/loading.ts'
import { showToast } from '../ui/shared/toast.ts'
import { store } from '../core/state.ts'
import { bus } from '../core/events.ts'

let currentRegionId: string | null = null
const initializedRegions = new Set<string>()

const FRANCE_SOURCE_ID = 'geology-france'

function addFranceNational(map: maplibregl.Map): void {
  if (initializedRegions.has('france')) return
  initializedRegions.add('france')
  if (!map.getSource(FRANCE_SOURCE_ID)) {
    map.addSource(FRANCE_SOURCE_ID, {
      type: 'vector',
      url: 'pmtiles:///data/france.pmtiles',
    })
  }
  for (const layer of createNationalLayers()) {
    if (!map.getLayer(layer.id)) map.addLayer(layer)
  }
}

function setNationalVisibility(map: maplibregl.Map, visibility: 'visible' | 'none'): void {
  for (const layerId of NATIONAL_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue
    if (layerId === 'geology-fill__france') {
      map.setPaintProperty(layerId, 'fill-opacity', visibility === 'visible' ? 0.75 : 0)
      map.setLayoutProperty(layerId, 'visibility', 'visible')
    } else {
      map.setLayoutProperty(layerId, 'visibility', visibility)
    }
  }
}

export const DATA_REGIONS = REGIONS.filter(r => r.id !== 'france')

function getSourceId(regionId: string): string {
  return `geology-${regionId}`
}

function addRegionToMap(map: maplibregl.Map, regionId: string): void {
  if (initializedRegions.has(regionId)) return
  initializedRegions.add(regionId)

  const sourceId = getSourceId(regionId)
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'vector',
      url: `pmtiles:///data/${regionId}.pmtiles`
    })
  }
  for (const layer of createLayersForRegion(regionId)) {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer)
    }
  }
}

export function initRegions(map: maplibregl.Map, initialRegionId: string): void {
  // Always init the national france layer (france.pmtiles)
  addFranceNational(map)

  if (initialRegionId === 'france') {
    // France view: also pre-load 13 regional layers (for local navigation later)
    for (const region of DATA_REGIONS) {
      addRegionToMap(map, region.id)
    }
  } else {
    addRegionToMap(map, initialRegionId)
  }
}

export async function ensureRegionInitialized(map: maplibregl.Map, regionId: string): Promise<void> {
  if (initializedRegions.has(regionId)) return
  addRegionToMap(map, regionId)

  // Wait for the source to be available
  const sourceId = getSourceId(regionId)
  if (map.isSourceLoaded(sourceId)) return

  await new Promise<void>((resolve) => {
    const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        map.off('sourcedata', onSourceData)
        resolve()
      }
    }
    map.on('sourcedata', onSourceData)
  })
}

function setRegionVisibility(map: maplibregl.Map, regionId: string, visibility: 'visible' | 'none'): void {
  for (const layerId of getRegionLayerIds(regionId)) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility)
    }
  }
}

function hideAllRegions(map: maplibregl.Map): void {
  setNationalVisibility(map, 'none')
  for (const region of DATA_REGIONS) {
    setRegionVisibility(map, region.id, 'none')
  }
}

export async function loadRegion(map: maplibregl.Map, regionId: string): Promise<void> {
  const region = getRegion(regionId)
  if (!region) {
    showToast(`Region inconnue : ${regionId}`, 'error')
    return
  }

  if (regionId === currentRegionId) return

  if (regionId === 'france') {
    hideAllRegions(map)
    setNationalVisibility(map, 'visible')
    currentRegionId = regionId
    store.setState({ regionId, loading: false })
    map.fitBounds(region.bounds, { padding: 40, duration: 1000 })
    bus.emit('region:loaded', { regionId })
    return
  }

  await ensureRegionInitialized(map, regionId)

  hideAllRegions(map)

  store.setState({ loading: true, regionId })
  showMapLoading(`Chargement ${region.name}...`)

  setRegionVisibility(map, regionId, 'visible')
  ensureModeAfterRegionLoad(map)
  currentRegionId = regionId

  const sourceId = getSourceId(regionId)
  const isAlreadyLoaded = map.isSourceLoaded(sourceId)
  if (isAlreadyLoaded) {
    hideMapLoading()
    store.setState({ loading: false })
    bus.emit('region:loaded', { regionId })
  } else {
    const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        map.off('sourcedata', onSourceData)
        clearTimeout(loadTimeout)
        hideMapLoading()
        store.setState({ loading: false })
        bus.emit('region:loaded', { regionId })
      }
    }
    const loadTimeout = setTimeout(() => {
      map.off('sourcedata', onSourceData)
      hideMapLoading()
      store.setState({ loading: false })
      showToast(`Chargement ${region.name} trop long`, 'warning')
    }, 15000)
    map.on('sourcedata', onSourceData)
  }

  map.fitBounds(region.bounds, { padding: 40, duration: 1000 })
}

export function getCurrentRegionId(): string | null {
  return currentRegionId
}

export function loadInitialRegion(map: maplibregl.Map, regionId: string): void {
  loadRegion(map, regionId)
}

/** For test isolation only — resets module-level state between tests */
export function _resetInitializedRegions(): void {
  initializedRegions.clear()
}
