import 'maplibre-gl/dist/maplibre-gl.css'
import './styles/index.css'
import { initTheme } from './ui/theme.ts'
import { initSentry, initPlausible } from './telemetry.ts'
import { createMap } from './map/setup.ts'

initSentry()
initPlausible()
initTheme()
import { loadInitialRegion } from './map/region-manager.ts'
import { DEFAULT_REGION } from './config/regions.ts'
import { setupInfoPanel } from './controls/info-panel.ts'
import { setupLayerToggle } from './controls/layer-toggle.ts'
import { setupLegend } from './controls/legend.ts'
import { setupRegionSelector } from './controls/region-selector.ts'
import { setupNoticesPanel } from './controls/notices-panel.ts'
import { setupModeToggle } from './controls/mode-toggle.ts'
import { setupTopbar } from './ui/controls/topbar.ts'
import { registerDipIcon } from './map/dip-icon.ts'

const map = createMap('map')

map.on('load', () => {
  map.resize()
  registerDipIcon(map)
  loadInitialRegion(map, DEFAULT_REGION)
  setupInfoPanel(map)
  setupLayerToggle(map)
  setupLegend()
  setupTopbar(map)
  setupRegionSelector(map)
  setupModeToggle(map)
  setupNoticesPanel()
})
