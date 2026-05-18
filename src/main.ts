import 'maplibre-gl/dist/maplibre-gl.css'
import './styles/index.css'
import { initTheme } from './ui/theme.ts'
import { initSentry, initPlausible } from './telemetry.ts'
import { createMap } from './map/setup.ts'
import { prefetchEnrichedFossils } from './utils/fossils-enriched.ts'
import { initRegions, loadInitialRegion } from './map/region-manager.ts'
import { DEFAULT_REGION, getRegion } from './config/regions.ts'
import { setupInfoPanel } from './controls/info-panel.ts'
import { setupLayerToggle } from './controls/layer-toggle.ts'
import { setupLegend } from './controls/legend.ts'
import { setupRegionSelector } from './controls/region-selector.ts'
import { setupNoticesPanel } from './controls/notices-panel.ts'
import { setupModeToggle } from './controls/mode-toggle.ts'
import { setupTopbar } from './ui/controls/topbar.ts'
import { registerDipIcon } from './map/dip-icon.ts'

initSentry()
initPlausible()
initTheme()

const params = new URLSearchParams(window.location.search)
const regionParam = params.get('region') ?? ''
const initialRegionId = getRegion(regionParam) ? regionParam : DEFAULT_REGION

const map = createMap('map')

map.on('load', () => {
  map.resize()
  registerDipIcon(map)
  initRegions(map, initialRegionId)
  loadInitialRegion(map, initialRegionId)
  setupInfoPanel(map)
  setupLayerToggle(map)
  setupLegend()
  setupTopbar(map)
  setupRegionSelector(map)
  setupModeToggle(map)
  setupNoticesPanel()

  // Prefetch fossils data during browser idle time to avoid cold-load on first panel open
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { prefetchEnrichedFossils() }, { timeout: 5000 })
  }
})
