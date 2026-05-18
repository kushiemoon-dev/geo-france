import type maplibregl from 'maplibre-gl'
import { faultsMajorLayer, faultsMinorLayer, dipPointsLayer, dipLabelsLayer } from '../map/styles.ts'

export function addStructureLayers(map: maplibregl.Map): void {
  map.addLayer(faultsMajorLayer)
  map.addLayer(faultsMinorLayer)
  map.addLayer(dipPointsLayer)
  map.addLayer(dipLabelsLayer)
}
