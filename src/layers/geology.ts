import type maplibregl from 'maplibre-gl'
import { store } from '../core/state.ts'
import { DATA_REGIONS } from '../map/region-manager.ts'

function getHighlightLayerId(): string {
  const { regionId } = store.getState()
  const activeId = (regionId && regionId !== 'france')
    ? regionId
    : DATA_REGIONS[0]?.id ?? 'bretagne'
  return `geology-highlight__${activeId}`
}

export function highlightFormation(map: maplibregl.Map, objectId: string | number | null): void {
  const layerId = getHighlightLayerId()
  if (!map.getLayer(layerId)) return
  if (objectId === null) {
    map.setFilter(layerId, ['==', 'OBJECTID', ''])
  } else {
    map.setFilter(layerId, ['==', 'OBJECTID', objectId])
  }
}
