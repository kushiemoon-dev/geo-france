import type maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { classifyNotation, extractLithology, extractMinerals, extractFossils } from '../utils/geology-data.ts'
import { getMineralInfo } from '../utils/mineral-data.ts'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTags(items: string[], className: string): string {
  if (items.length === 0) return ''
  return items.map(t => `<span class="popup-tag ${className}">${escapeHtml(t)}</span>`).join('')
}

function renderMineralDetails(minerals: string[]): string {
  if (minerals.length === 0) return ''

  const seen = new Set<string>()
  const rows: string[] = []

  for (const name of minerals) {
    const info = getMineralInfo(name)
    if (!info) continue
    // Deduplicate by formula (accent variants share the same info)
    const key = info.formula
    if (seen.has(key)) continue
    seen.add(key)

    const displayName = name.charAt(0).toUpperCase() + name.slice(1)
    const props = [
      info.crystalSystem ? info.crystalSystem.charAt(0).toUpperCase() + info.crystalSystem.slice(1) : null,
      `Durete ${info.hardness}`,
      info.category.charAt(0).toUpperCase() + info.category.slice(1),
    ].filter(Boolean).join(' · ')

    rows.push(
      `<div class="mineral-detail-row">` +
        `<span class="mineral-detail-name">${escapeHtml(displayName)}</span>` +
        `<span class="mineral-detail-formula">${info.formula}</span>` +
        `<span class="mineral-detail-props">${escapeHtml(props)}</span>` +
      `</div>`
    )
  }

  if (rows.length === 0) return ''
  return `<div class="detail-panel-section"><strong>Composition mineralogique</strong><div class="mineral-details">${rows.join('')}</div></div>`
}

function renderDetailContent(feature: MapGeoJSONFeature): string {
  const p = feature.properties
  const notation = p['NOTATION'] || p['notation'] || 'N/A'
  const descr = p['DESCR'] || p['descr'] || p['DESCRIPTION'] || ''

  const geo = classifyNotation(notation)

  const hierarchyParts = [geo.ere, geo.periode, geo.systeme, geo.etage].filter(Boolean)
  const hierarchy = hierarchyParts.join(' > ')

  const lithology = extractLithology(descr)
  const minerals = extractMinerals(descr)
  const fossils = extractFossils(descr)

  const ageText = geo.ageStartMa != null && geo.ageEndMa != null
    ? `${geo.ageStartMa} - ${geo.ageEndMa} Ma`
    : ''

  const wikiUrl = geo.wikiSlug
    ? `https://fr.wikipedia.org/wiki/${encodeURIComponent(geo.wikiSlug)}`
    : ''

  return `
    <button class="detail-panel-close" aria-label="Fermer">&times;</button>
    <div class="detail-panel-content">
      <div class="popup-age-bar" style="background-color: ${geo.color}"></div>
      <h3 class="detail-panel-title">${escapeHtml(notation)}</h3>
      ${hierarchy ? `<p class="popup-age-hierarchy">${escapeHtml(hierarchy)}</p>` : ''}
      ${ageText ? `<p class="detail-panel-age">${ageText}</p>` : ''}
      ${geo.summary ? `<p class="detail-panel-summary">${escapeHtml(geo.summary)}</p>` : ''}
      ${descr ? `<div class="detail-panel-section"><strong>Description BRGM</strong><p class="detail-panel-descr">${escapeHtml(descr)}</p></div>` : ''}
      ${lithology.length > 0 ? `<div class="detail-panel-section"><strong>Lithologie</strong><div class="popup-tags">${renderTags(lithology, 'tag-litho')}</div></div>` : ''}
      ${minerals.length > 0 ? `<div class="detail-panel-section"><strong>Mineraux</strong><div class="popup-tags">${renderTags(minerals, 'tag-mineral')}</div></div>` : ''}
      ${renderMineralDetails(minerals)}
      ${fossils.length > 0 ? `<div class="detail-panel-section"><strong>Fossiles</strong><div class="popup-tags">${renderTags(fossils, 'tag-fossil')}</div></div>` : ''}
      <div class="detail-panel-links">
        <strong>Liens externes</strong>
        ${wikiUrl ? `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer">Wikipedia FR</a>` : ''}
        <a href="https://infoterre.brgm.fr/viewer/MainTileForward.do" target="_blank" rel="noopener noreferrer">InfoTerre (BRGM)</a>
      </div>
      <p class="popup-source">Source: BD Charm-50 / BRGM</p>
    </div>
  `
}

let panelEl: HTMLElement | null = null
let closeCallback: (() => void) | null = null

function getOrCreatePanel(): HTMLElement {
  if (panelEl) return panelEl
  panelEl = document.createElement('div')
  panelEl.className = 'detail-panel'
  document.getElementById('map')!.appendChild(panelEl)
  return panelEl
}

export function openDetailPanel(feature: MapGeoJSONFeature): void {
  const panel = getOrCreatePanel()
  panel.innerHTML = renderDetailContent(feature)
  // Force reflow before adding .open for transition
  panel.offsetHeight
  panel.classList.add('open')

  const closeBtn = panel.querySelector('.detail-panel-close')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeDetailPanel(), { once: true })
  }
}

export function closeDetailPanel(): void {
  if (panelEl) {
    panelEl.classList.remove('open')
  }
  if (closeCallback) {
    closeCallback()
  }
}

export function setupDetailPanel(map: maplibregl.Map, onClose: () => void): void {
  closeCallback = onClose

  // Close panel when clicking on map (not on a geology feature)
  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['geology-fill'] })
    const dipFeatures = map.queryRenderedFeatures(e.point, { layers: ['dip-points'] })
    if (features.length === 0 && dipFeatures.length === 0) {
      closeDetailPanel()
    }
  })
}
