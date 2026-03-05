import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import { createMap } from './map/setup.ts'
import { addGeologyLayers } from './layers/geology.ts'
import { addStructureLayers } from './layers/structures.ts'
import { addOverlayLayers } from './layers/overlays.ts'
import { setupInfoPanel } from './controls/info-panel.ts'
import { setupLayerToggle } from './controls/layer-toggle.ts'
import { setupLegend } from './controls/legend.ts'

const map = createMap('map')

map.on('load', () => {
  addGeologyLayers(map)
  addOverlayLayers(map)
  addStructureLayers(map)
  setupInfoPanel(map)
  setupLayerToggle(map)
  setupLegend()
})
