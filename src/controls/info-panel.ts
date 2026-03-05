import maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { highlightFormation } from '../layers/geology.ts'
import { openDetailPanel, setupDetailPanel, closeDetailPanel } from './detail-panel.ts'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
    openDetailPanel(feature)
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
