import type maplibregl from 'maplibre-gl'
import { REGIONS, getRegion } from '../config/regions.ts'
import { createLayersForRegion, getRegionLayerIds, getRegionLayerId } from './styles.ts'
import { ensureModeAfterRegionLoad } from './map-mode.ts'
import { showMapLoading, hideMapLoading } from '../ui/shared/loading.ts'
import { showToast } from '../ui/shared/toast.ts'
import { store } from '../core/state.ts'
import { bus } from '../core/events.ts'

let currentRegionId: string | null = null

export const DATA_REGIONS = REGIONS.filter(r => r.id !== 'france')

function getSourceId(regionId: string): string {
  return `geology-${regionId}`
}

export function initAllRegions(map: maplibregl.Map): void {
  for (const region of DATA_REGIONS) {
    const sourceId = getSourceId(region.id)
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `pmtiles:///data/${region.id}.pmtiles`
      })
    }
    for (const layer of createLayersForRegion(region.id)) {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer)
      }
    }
  }
}

function setRegionVisibility(map: maplibregl.Map, regionId: string, visibility: 'visible' | 'none'): void {
  for (const layerId of getRegionLayerIds(regionId)) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility)
    }
  }
}

function hideAllRegions(map: maplibregl.Map): void {
  for (const region of DATA_REGIONS) {
    setRegionVisibility(map, region.id, 'none')
  }
}

export function loadRegion(map: maplibregl.Map, regionId: string): void {
  const region = getRegion(regionId)
  if (!region) {
    showToast(`Region inconnue : ${regionId}`, 'error')
    return
  }

  if (regionId === currentRegionId) return

  hideAllRegions(map)

  if (regionId === 'france') {
    for (const r of DATA_REGIONS) {
      setRegionVisibility(map, r.id, 'visible')
    }
    currentRegionId = regionId
    store.setState({ regionId, loading: false })
    map.fitBounds(region.bounds, { padding: 40, duration: 1000 })
    bus.emit('region:loaded', { regionId })
    return
  }

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

export function getActiveRegionLayerId(baseId: string): string {
  const regionId = currentRegionId && currentRegionId !== 'france'
    ? currentRegionId
    : DATA_REGIONS[0]?.id ?? 'bretagne'
  return getRegionLayerId(baseId, regionId)
}
