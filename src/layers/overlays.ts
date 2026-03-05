import type maplibregl from 'maplibre-gl'
import { geologyOutlineLayer, surchargeLayer } from '../map/styles.ts'

export function addOverlayLayers(map: maplibregl.Map): void {
  map.addLayer(geologyOutlineLayer)
  map.addLayer(surchargeLayer)
}
