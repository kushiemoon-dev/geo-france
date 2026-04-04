import type maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { classifyNotation, extractLithology, extractFossils } from '../utils/geology-data.ts'
import { getMineralInfo, getMineralBarColor, getRockInfo } from '../utils/mineral-data.ts'
import type { GeologyEntry } from '../utils/geology-data.ts'
import type { RockInfo } from '../utils/mineral-data.ts'
import { bus } from '../core/events.ts'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTags(items: string[], className: string): string {
  if (items.length === 0) return ''
  return items.map(t => `<span class="popup-tag ${className}">${escapeHtml(t)}</span>`).join('')
}

function renderAgeSection(geo: GeologyEntry, notation: string, carte: string): string {
  const rows: [string, string][] = []

  if (geo.ere) {
    const ereParts = [geo.ere, geo.periode].filter(Boolean)
    rows.push(['Ere geologique', ereParts.join(' / ')])
  }

  const periodParts = [geo.systeme, geo.etage].filter(Boolean)
  if (periodParts.length > 0) {
    rows.push(['Periode', periodParts.join(' – ')])
  }

  if (geo.ageStartMa != null && geo.ageEndMa != null) {
    rows.push(['Age absolu', `${geo.ageStartMa} – ${geo.ageEndMa} Ma`])
  }

  const feuilleLabel = carte ? ` (feuille ${carte})` : ''
  rows.push(['Code BRGM', `${notation}${feuilleLabel}`])

  if (geo.summary) {
    rows.push(['Formation', geo.summary])
  }

  const rowsHtml = rows.map(([label, value]) =>
    `<div class="detail-row"><span class="detail-row-label">${escapeHtml(label)}</span><span class="detail-row-value">${escapeHtml(value)}</span></div>`
  ).join('')

  return `<div class="detail-section-header">Age &amp; Stratigraphie</div>${rowsHtml}`
}

function renderPetrographySection(lithology: string[]): string {
  const seen = new Set<string>()
  let rockInfo: RockInfo | undefined

  for (const litho of lithology) {
    const key = litho.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    rockInfo = getRockInfo(key)
    if (rockInfo) break
  }

  if (!rockInfo) return ''

  const rows: [string, string][] = []
  const typeLabel = `Roche ${rockInfo.type}${rockInfo.origin ? ` ${rockInfo.origin}` : ''}`
  rows.push(['Type', typeLabel])
  if (rockInfo.facies) rows.push(['Facies', rockInfo.facies])
  if (rockInfo.texture) rows.push(['Texture', rockInfo.texture])

  const rowsHtml = rows.map(([label, value]) =>
    `<div class="detail-row"><span class="detail-row-label">${escapeHtml(label)}</span><span class="detail-row-value">${escapeHtml(value)}</span></div>`
  ).join('')

  const barsHtml = rockInfo.minerals.map(m => {
    const pctNum = parseInt(m.percent, 10)
    const color = getMineralBarColor(m.name)
    const displayName = m.name.charAt(0).toUpperCase() + m.name.slice(1)
    const mineralInfo = getMineralInfo(m.name)
    const formulaLine = mineralInfo
      ? `<div class="mineral-bar-formula">${mineralInfo.formula}</div>`
      : ''

    return `<div class="mineral-bar-row">` +
      `<span class="mineral-bar-name">${escapeHtml(displayName)}</span>` +
      `<div class="mineral-bar-track"><div class="mineral-bar-fill" style="width:${pctNum}%;background:${color}"></div></div>` +
      `<span class="mineral-bar-pct">${escapeHtml(m.percent)}</span>` +
      `</div>${formulaLine}`
  }).join('')

  return `<div class="detail-section-header">Petrographie</div>${rowsHtml}<div style="margin-top:10px">${barsHtml}</div>`
}

function findRockImage(lithology: string[]): string | undefined {
  for (const litho of lithology) {
    const info = getRockInfo(litho)
    if (info?.image) return info.image
  }
  return undefined
}

function renderDetailContent(feature: MapGeoJSONFeature): string {
  const p = feature.properties
  const notation = p['NOTATION'] || p['notation'] || 'N/A'
  const descr = p['DESCR'] || p['descr'] || p['DESCRIPTION'] || ''
  const carte = p['CARTE'] || p['carte'] || ''

  const geo = classifyNotation(notation)

  const lithology = extractLithology(descr)
  const fossils = extractFossils(descr)
  const rockImage = findRockImage(lithology)

  const wikiUrl = geo.wikiSlug
    ? `https://fr.wikipedia.org/wiki/${encodeURIComponent(geo.wikiSlug)}`
    : ''

  return `
    <button class="detail-panel-close" aria-label="Fermer">&times;</button>
    <div class="detail-panel-content">
      <div class="popup-age-bar" style="background-color: ${geo.color}"></div>
      ${rockImage ? `<div class="detail-panel-hero"><img src="${rockImage}" alt="" loading="lazy"></div>` : ''}
      <h3 class="detail-panel-title">${escapeHtml(notation)}</h3>
      ${renderAgeSection(geo, notation, carte)}
      ${renderPetrographySection(lithology)}
      ${descr ? `<div class="detail-panel-section"><strong>Description BRGM</strong><p class="detail-panel-descr">${escapeHtml(descr)}</p></div>` : ''}
      ${lithology.length > 0 ? `<div class="detail-panel-section"><strong>Lithologie</strong><div class="popup-tags">${renderTags(lithology, 'tag-litho')}</div></div>` : ''}
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

  bus.on('mode:change', ({ mode }) => {
    if (mode === 'local') {
      closeDetailPanel()
    }
  })
}
