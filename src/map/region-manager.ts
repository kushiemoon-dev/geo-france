import type maplibregl from 'maplibre-gl'
import { ALL_LAYERS } from './styles.ts'
import { getRegion } from '../config/regions.ts'
import { ensureModeAfterRegionLoad } from './map-mode.ts'

let currentRegionId: string | null = null
let loadingIndicator: HTMLElement | null = null

function showLoading(): void {
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div')
    loadingIndicator.className = 'region-loading'
    loadingIndicator.textContent = 'Chargement...'
    document.body.appendChild(loadingIndicator)
  }
  loadingIndicator.style.display = 'block'
}

function hideLoading(): void {
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none'
  }
}

function removeGeologyLayers(map: maplibregl.Map): void {
  // Remove in reverse order to avoid dependency issues
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
    console.error(`Unknown region: ${regionId}`)
    return
  }

  if (regionId === currentRegionId) return

  showLoading()

  // Dismiss any open popup by firing a click away
  // MapLibre popups with closeOnClick:true will close on next map click
  // But we can also just close all popups on the map
  // The cleanest way: remove layers, source, re-add

  // Remove existing geology layers and source
  removeGeologyLayers(map)
  removeGeologySource(map)

  // Add new source and layers
  addGeologySource(map, regionId)
  addGeologyLayers(map)
  ensureModeAfterRegionLoad(map)

  currentRegionId = regionId

  // Listen for source load to hide loading indicator
  const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId === 'geology' && e.isSourceLoaded) {
      hideLoading()
      map.off('sourcedata', onSourceData)
    }
  }
  map.on('sourcedata', onSourceData)

  // Fly to region bounds
  map.fitBounds(region.bounds, { padding: 40, duration: 1000 })
}

export function getCurrentRegionId(): string | null {
  return currentRegionId
}

export function loadInitialRegion(map: maplibregl.Map, regionId: string): void {
  loadRegion(map, regionId)
}
