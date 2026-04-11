import maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { highlightFormation } from '../layers/geology.ts'
import { openDetailPanel, setupDetailPanel, closeDetailPanel } from './detail-panel.ts'
import { store } from '../core/state.ts'
import { showToast } from '../ui/shared/toast.ts'
import { LOCAL_MIN_ZOOM } from '../map/map-mode.ts'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

let wmsAbort: AbortController | null = null

function lngLatToEpsg3857(lng: number, lat: number): [number, number] {
  const x = lng * 20037508.34 / 180
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)
  return [x, y * 20037508.34 / 180]
}

async function queryWmsFeatureInfo(
  lngLat: { lng: number; lat: number }
): Promise<Record<string, unknown> | null> {
  wmsAbort?.abort()
  wmsAbort = new AbortController()
  const [x, y] = lngLatToEpsg3857(lngLat.lng, lngLat.lat)
  const buf = 50
  const bbox = `${x - buf},${y - buf},${x + buf},${y + buf}`
  const url = 'https://geoservices.brgm.fr/geologie?' + [
    'SERVICE=WMS', 'VERSION=1.1.1', 'REQUEST=GetFeatureInfo',
    'LAYERS=GEO050_S_FGEOL', 'QUERY_LAYERS=GEO050_S_FGEOL',
    'INFO_FORMAT=application/json', 'SRS=EPSG:3857',
    'WIDTH=101', 'HEIGHT=101', 'X=50', 'Y=50',
    `BBOX=${bbox}`,
  ].join('&')
  const res = await fetch(url, { signal: wmsAbort.signal })
  if (!res.ok) return null
  const data = await res.json() as { features?: { properties: Record<string, unknown> }[] }
  const features = data?.features
  if (!Array.isArray(features) || features.length === 0) return null
  return features[0].properties
}

function formatDipPopupContent(feature: MapGeoJSONFeature): string {
  const p = feature.properties
  const pendage = p['PENDAGE'] ?? p['pendage'] ?? ''
  const azimut = p['AZIMUT'] ?? p['azimut'] ?? ''
  const descr = p['DESCR'] ?? p['descr'] ?? ''
  const attr = p['ATTR'] ?? p['attr'] ?? ''

  return `
    <div class="geology-popup">
      <div class="popup-age-bar" style="background-color: #000000"></div>
      <h3>Point de pendage</h3>
      ${pendage !== '' && pendage !== 999 ? `<p><strong>Pendage:</strong> ${escapeHtml(String(pendage))}\u00B0</p>` : ''}
      ${azimut !== '' ? `<p><strong>Azimut:</strong> ${escapeHtml(String(azimut))}\u00B0</p>` : ''}
      ${descr ? `<p class="popup-descr">${escapeHtml(descr)}</p>` : ''}
      ${attr ? `<p style="font-size:11px;color:#666">${escapeHtml(attr)}</p>` : ''}
      <p class="popup-source">Source: BD Charm-50 / BRGM</p>
    </div>
  `
}


export function setupInfoPanel(map: maplibregl.Map): void {
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '320px'
  })

  // Setup detail panel with close callback to clear highlight
  setupDetailPanel(map, () => {
    highlightFormation(map, null)
  })

  map.on('click', 'dip-points', (e) => {
    if (!e.features || e.features.length === 0) return

    // Close detail panel if open
    closeDetailPanel()

    popup
      .setLngLat(e.lngLat)
      .setHTML(formatDipPopupContent(e.features[0]))
      .addTo(map)
  })

  map.on('click', 'geology-fill', (e) => {
    if (!e.features || e.features.length === 0) return

    // Close any open dip popup
    popup.remove()

    const feature = e.features[0]
    const objectId = feature.properties['OBJECTID'] || feature.properties['objectid'] || null
    highlightFormation(map, objectId)

    // If DESCR is missing, enrich from WMS before opening
    const descr = String(feature.properties['DESCR'] || feature.properties['descr'] || '')
    if (descr) {
      openDetailPanel(feature)
      return
    }
    const canvas = map.getCanvas()
    canvas.style.cursor = 'wait'
    queryWmsFeatureInfo(e.lngLat)
      .then(props => {
        canvas.style.cursor = 'pointer'
        if (props) {
          openDetailPanel({ properties: { ...feature.properties, ...props } })
        } else {
          openDetailPanel(feature)
        }
      })
      .catch(() => {
        canvas.style.cursor = 'pointer'
        openDetailPanel(feature)
      })
  })

  map.on('click', (e) => {
    if (store.getState().mode !== 'local') return
    if (map.getZoom() < LOCAL_MIN_ZOOM) return

    // Only handle clicks not already caught by geology-fill layer
    const features = map.queryRenderedFeatures(e.point, { layers: ['geology-fill'] })
    if (features.length > 0) return

    // Click on area without vector tile: query WMS directly
    const canvas = map.getCanvas()
    canvas.style.cursor = 'wait'
    queryWmsFeatureInfo(e.lngLat)
      .then(props => {
        canvas.style.cursor = ''
        if (!props) { showToast('Aucune donnee geologique ici', 'info'); return }
        openDetailPanel({ properties: props })
      })
      .catch((err: unknown) => {
        canvas.style.cursor = ''
        if (err instanceof DOMException && err.name === 'AbortError') return
        showToast('Erreur de requete BRGM', 'warning')
      })
  })

  map.on('mouseenter', 'dip-points', () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', 'dip-points', () => {
    map.getCanvas().style.cursor = ''
  })

  map.on('mouseenter', 'geology-fill', () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', 'geology-fill', () => {
    map.getCanvas().style.cursor = ''
  })
}
