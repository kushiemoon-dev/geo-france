import maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { openDetailPanel, setupDetailPanel, closeDetailPanel } from './detail-panel.ts'
import { store } from '../core/state.ts'
import { showToast } from '../ui/shared/toast.ts'
import { LOCAL_MIN_ZOOM } from '../map/map-mode.ts'
import { DATA_REGIONS } from '../map/region-manager.ts'
import { escapeHtml } from '../utils/html.ts'

function getHighlightLayerId(): string {
  const { regionId } = store.getState()
  const activeId = (regionId && regionId !== 'france')
    ? regionId
    : DATA_REGIONS[0]?.id ?? 'bretagne'
  return `geology-highlight__${activeId}`
}

function highlightFormation(map: maplibregl.Map, objectId: string | number | null): void {
  const layerId = getHighlightLayerId()
  if (!map.getLayer(layerId)) return
  if (objectId === null) {
    map.setFilter(layerId, ['==', 'OBJECTID', ''])
  } else {
    map.setFilter(layerId, ['==', 'OBJECTID', objectId])
  }
}

function getAllFillLayerIds(): string[] {
  return DATA_REGIONS.map(r => `geology-fill__${r.id}`)
}

function getAllDipLayerIds(): string[] {
  return DATA_REGIONS.map(r => `dip-points__${r.id}`)
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
      <p class="popup-source">Source : BD Charm-50 © BRGM — <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence" target="_blank" rel="noopener noreferrer">Données libres – Licence Etalab 2.0</a></p>
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

  map.on('click', (e) => {
    const dipFeatures = map.queryRenderedFeatures(e.point, { layers: getAllDipLayerIds() })
    if (dipFeatures.length > 0) {
      closeDetailPanel()
      popup
        .setLngLat(e.lngLat)
        .setHTML(formatDipPopupContent(dipFeatures[0] as MapGeoJSONFeature))
        .addTo(map)
      return
    }

    const fillFeatures = map.queryRenderedFeatures(e.point, { layers: getAllFillLayerIds() })
    if (fillFeatures.length > 0) {
      popup.remove()
      const feature = fillFeatures[0] as MapGeoJSONFeature
      const objectId = feature.properties['OBJECTID'] || feature.properties['objectid'] || null
      highlightFormation(map, objectId)

      const descr = String(feature.properties['DESCR'] || feature.properties['descr'] || '')
      const legende = String(feature.properties['LEGENDE'] || feature.properties['legende'] || '')
      if (descr || legende) {
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
      return
    }

    // Local mode without vector tiles: direct WMS request
    if (store.getState().mode === 'local' && map.getZoom() >= LOCAL_MIN_ZOOM) {
      const canvas = map.getCanvas()
      canvas.style.cursor = 'wait'
      queryWmsFeatureInfo(e.lngLat)
        .then(props => {
          canvas.style.cursor = ''
          if (!props) { showToast('Aucune donnée géologique ici', 'info'); return }
          openDetailPanel({ properties: props })
        })
        .catch((err: unknown) => {
          canvas.style.cursor = ''
          if (err instanceof DOMException && err.name === 'AbortError') return
          showToast('Erreur de requete BRGM', 'warning')
        })
    }
  })

  map.on('mousemove', (e) => {
    const dipHit = map.queryRenderedFeatures(e.point, { layers: getAllDipLayerIds() })
    const fillHit = map.queryRenderedFeatures(e.point, { layers: getAllFillLayerIds() })
    map.getCanvas().style.cursor = (dipHit.length > 0 || fillHit.length > 0) ? 'pointer' : ''
  })
}
