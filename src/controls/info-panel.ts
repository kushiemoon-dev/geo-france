import maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { highlightFormation } from '../layers/geology.ts'
import { classifyNotation, extractLithology, extractMinerals, extractFossils } from '../utils/geology-data.ts'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTags(items: string[], className: string): string {
  if (items.length === 0) return ''
  return items.map(t => `<span class="popup-tag ${className}">${escapeHtml(t)}</span>`).join('')
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
      ${pendage !== '' && pendage !== 999 ? `<p><strong>Pendage:</strong> ${escapeHtml(String(pendage))}°</p>` : ''}
      ${azimut !== '' ? `<p><strong>Azimut:</strong> ${escapeHtml(String(azimut))}°</p>` : ''}
      ${descr ? `<p class="popup-descr">${escapeHtml(descr)}</p>` : ''}
      ${attr ? `<p style="font-size:11px;color:#666">${escapeHtml(attr)}</p>` : ''}
      <p class="popup-source">Source: BD Charm-50 / BRGM</p>
    </div>
  `
}

function formatPopupContent(feature: MapGeoJSONFeature): string {
  const p = feature.properties
  const notation = p['NOTATION'] || p['notation'] || 'N/A'
  const descr = p['DESCR'] || p['descr'] || p['DESCRIPTION'] || ''

  const geo = classifyNotation(notation)

  // Build age hierarchy: Ere > Periode > Systeme > Etage
  const hierarchyParts = [geo.ere, geo.periode, geo.systeme, geo.etage].filter(Boolean)
  const hierarchy = hierarchyParts.length > 0 ? hierarchyParts.join(' &gt; ') : ''

  // Extract terms from description
  const lithology = extractLithology(descr)
  const minerals = extractMinerals(descr)
  const fossils = extractFossils(descr)

  return `
    <div class="geology-popup">
      <div class="popup-age-bar" style="background-color: ${geo.color}"></div>
      <h3>${escapeHtml(notation)}</h3>
      ${hierarchy ? `<p class="popup-age-hierarchy">${hierarchy}</p>` : ''}
      ${descr ? `<p class="popup-descr">${escapeHtml(descr)}</p>` : ''}
      ${lithology.length > 0 ? `<div class="popup-section"><strong>Lithologie</strong><div class="popup-tags">${renderTags(lithology, 'tag-litho')}</div></div>` : ''}
      ${minerals.length > 0 ? `<div class="popup-section"><strong>Mineraux</strong><div class="popup-tags">${renderTags(minerals, 'tag-mineral')}</div></div>` : ''}
      ${fossils.length > 0 ? `<div class="popup-section"><strong>Fossiles</strong><div class="popup-tags">${renderTags(fossils, 'tag-fossil')}</div></div>` : ''}
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

  map.on('click', 'dip-points', (e) => {
    if (!e.features || e.features.length === 0) return

    popup
      .setLngLat(e.lngLat)
      .setHTML(formatDipPopupContent(e.features[0]))
      .addTo(map)
  })

  map.on('click', 'geology-fill', (e) => {
    if (!e.features || e.features.length === 0) return

    const feature = e.features[0]
    const objectId = feature.properties['OBJECTID'] || feature.properties['objectid'] || null

    highlightFormation(map, objectId)

    popup
      .setLngLat(e.lngLat)
      .setHTML(formatPopupContent(feature))
      .addTo(map)
  })

  popup.on('close', () => {
    highlightFormation(map, null)
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
