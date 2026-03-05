import type maplibregl from 'maplibre-gl'
import { geologyFillLayer, geologyHighlightLayer } from '../map/styles.ts'

export function addGeologyLayers(map: maplibregl.Map): void {
  map.addLayer(geologyFillLayer)
  map.addLayer(geologyHighlightLayer)
}

export function highlightFormation(map: maplibregl.Map, objectId: string | number | null): void {
  if (objectId === null) {
    map.setFilter('geology-highlight', ['==', 'OBJECTID', ''])
  } else {
    map.setFilter('geology-highlight', ['==', 'OBJECTID', objectId])
  }
}
