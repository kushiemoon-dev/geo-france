import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import { createMap } from './map/setup.ts'
import { loadInitialRegion } from './map/region-manager.ts'
import { DEFAULT_REGION } from './config/regions.ts'
import { setupInfoPanel } from './controls/info-panel.ts'
import { setupLayerToggle } from './controls/layer-toggle.ts'
import { setupLegend } from './controls/legend.ts'
import { setupRegionSelector } from './controls/region-selector.ts'

const map = createMap('map')

map.on('load', () => {
  loadInitialRegion(map, DEFAULT_REGION)
  setupInfoPanel(map)
  setupLayerToggle(map)
  setupLegend()
  setupRegionSelector(map)
})
