import type maplibregl from 'maplibre-gl'
import { faultsLayer, dipPointsLayer, dipLabelsLayer } from '../map/styles.ts'

export function addStructureLayers(map: maplibregl.Map): void {
  map.addLayer(faultsLayer)
  map.addLayer(dipPointsLayer)
  map.addLayer(dipLabelsLayer)
}
