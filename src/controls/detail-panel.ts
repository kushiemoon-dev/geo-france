import type maplibregl from 'maplibre-gl'
export type FeatureLike = { properties: Record<string, unknown> }
import { classifyNotation, extractLithology, extractFossils, LITHO_WIKI_SLUGS, FOSSIL_TERM_WIKI_SLUGS } from '../utils/geology-data.ts'
import type { FossilGroups } from '../utils/geology-data.ts'
import { getEnrichedFossils, mergeFossils } from '../utils/fossils-enriched.ts'
import { getMineralInfo, getMineralBarColor, getRockInfo, hasUsableImage } from '../utils/mineral-data.ts'
import type { GeologyEntry } from '../utils/geology-data.ts'
import type { RockInfo } from '../utils/mineral-data.ts'
import { bus } from '../core/events.ts'
import { store } from '../core/state.ts'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTags(items: string[], className: string, wikiSlugs?: Record<string, string>, enrichedSet?: Set<string>): string {
  if (items.length === 0) return ''
  return items.map(t => {
    const slug = wikiSlugs?.[t]
    const extra = enrichedSet?.has(t) ? ' tag-enriched' : ''
    if (slug) {
      const url = `https://fr.wikipedia.org/wiki/${encodeURIComponent(slug)}`
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="popup-tag ${className}${extra}">${escapeHtml(t)}</a>`
    }
    return `<span class="popup-tag ${className}${extra}">${escapeHtml(t)}</span>`
  }).join('')
}

function renderAgeSection(geo: GeologyEntry, notation: string, carte: string): string {
  const rows: [string, string][] = []

  if (geo.ere) {
    const ereParts = [geo.ere, geo.periode].filter(Boolean)
    rows.push(['Ère géologique', ereParts.join(' / ')])
  }

  const periodParts = [geo.systeme, geo.etage].filter(Boolean)
  if (periodParts.length > 0) {
    rows.push(['Période', periodParts.join(' – ')])
  }

  if (geo.ageStartMa != null && geo.ageEndMa != null) {
    rows.push(['Âge absolu', `${geo.ageStartMa} – ${geo.ageEndMa} Ma`])
  }

  const feuilleLabel = carte ? ` (feuille ${carte})` : ''
  rows.push(['Code BRGM', `${notation}${feuilleLabel}`])

  if (geo.summary) {
    rows.push(['Formation', geo.summary])
  }

  const rowsHtml = rows.map(([label, value]) =>
    `<div class="detail-row"><span class="detail-row-label">${escapeHtml(label)}</span><span class="detail-row-value">${escapeHtml(value)}</span></div>`
  ).join('')

  return `<div class="detail-section-header">Âge &amp; Stratigraphie</div>${rowsHtml}`
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

  return `<div class="detail-section-header">Pétrographie</div>${rowsHtml}<div style="margin-top:10px">${barsHtml}</div>`
}

const LITHO_PRIORITY = [
  'calcaire','craie','marne','dolomie','gres','argile','sable','schiste',
  'granite','basalte','gneiss','micaschiste','quartzite','ardoise','silex',
  'rhyolite','andesite','dacite','phonolite','trachyte','diorite','granodiorite',
  'tonalite','migmatite','eclogite','serpentinite','ophite','tuf','loess',
  'limon','argilite','siltite','grauwacke','arkose','pelite','lumachelle',
  'oolite','travertin','falun','radiolarite','gaize','meuliere','tourbe',
  'leucogranite','microgranite','mylonite','corneenne','phyllade','ampelite',
  'phtanite','spilite','cinerite','trondhjemite','tillite',
  'poudingue','breche','conglomerat','alluvion','colluvion','greze','tangue','alterite',
]

function sortLithologyByPriority(lithology: string[]): string[] {
  const rank = (s: string) => {
    const i = LITHO_PRIORITY.indexOf(s.toLowerCase())
    return i === -1 ? LITHO_PRIORITY.length : i
  }
  return [...lithology].sort((a, b) => rank(a) - rank(b))
}

function findRockImage(lithology: string[]): { image: string; name: string } | undefined {
  for (const litho of sortLithologyByPriority(lithology)) {
    const info = getRockInfo(litho)
    if (hasUsableImage(info)) return { image: info!.image!, name: litho }
  }
  return undefined
}

function renderDetailContent(feature: FeatureLike): string {
  const p = feature.properties
  const notation = String(p['NOTATION'] || p['notation'] || 'N/A')
  const descr = String(p['DESCR'] || p['descr'] || p['DESCRIPTION'] || '')
  const legende = String(p['LEGENDE'] || p['legende'] || '')
  const carte = String(p['CARTE'] || p['carte'] || '')

  const geo = classifyNotation(notation)

  const lithology = extractLithology(descr, legende)
  const extracted: FossilGroups = extractFossils(descr, legende, geo.summary ?? '')
  const enrichedRaw = getEnrichedFossils(carte)
  const { merged: fossils, enrichedSet } = mergeFossils(extracted, enrichedRaw)
  const rock = findRockImage(lithology)

  const wikiUrl = geo.wikiSlug
    ? `https://fr.wikipedia.org/wiki/${encodeURIComponent(geo.wikiSlug)}`
    : ''

  return `
    <button class="detail-panel-close" aria-label="Fermer">&times;</button>
    <div class="detail-panel-content">
      <div class="popup-age-bar" style="background-color: ${escapeHtml(geo.color)}"></div>
      ${rock ? `<div class="detail-panel-hero"><img src="${escapeHtml(rock.image)}" alt="Échantillon de ${escapeHtml(rock.name)}" loading="lazy" onerror="this.closest('.detail-panel-hero').remove()"></div>` : ''}
      <h3 class="detail-panel-title" id="detail-panel-title">${escapeHtml(notation)}</h3>
      ${renderAgeSection(geo, notation, carte)}
      ${renderPetrographySection(lithology)}
      ${descr ? `<div class="detail-panel-section"><strong>Description BRGM</strong><p class="detail-panel-descr">${escapeHtml(descr)}</p></div>` : ''}
      ${lithology.length > 0 ? `<div class="detail-panel-section"><strong>Lithologie</strong><div class="popup-tags">${renderTags(lithology, 'tag-litho', LITHO_WIKI_SLUGS)}</div></div>` : ''}
      ${Object.keys(fossils).some(g => g !== 'genres') ? `
        <div class="detail-panel-section">
          <strong>Fossiles</strong>
          ${Object.entries(fossils).filter(([group]) => group !== 'genres').map(([group, terms]) => `
            <div class="fossil-group">
              <span class="fossil-group-label">${escapeHtml(group)}</span>
              <div class="popup-tags">${renderTags(terms, 'tag-fossil', FOSSIL_TERM_WIKI_SLUGS, enrichedSet)}</div>
            </div>
          `).join('')}
          ${enrichedSet.size > 0 ? `<p class="fossil-inferred-note">Termes en pointillés : données notices BRGM</p>` : ''}
        </div>
      ` : ''}
      <div class="detail-panel-links">
        <strong>Liens externes</strong>
        ${wikiUrl ? `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer">Wikipedia FR</a>` : ''}
        <a href="https://infoterre.brgm.fr/viewer/MainTileForward.do" target="_blank" rel="noopener noreferrer">InfoTerre (BRGM)</a>
      </div>
      <p class="popup-source">Source : BD Charm-50 © BRGM — <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence" target="_blank" rel="noopener noreferrer">Données libres – Licence Etalab 2.0</a></p>
    </div>
  `
}

let panelEl: HTMLElement | null = null
let closeCallback: (() => void) | null = null
let triggerEl: HTMLElement | null = null
let removeTrapFocus: (() => void) | null = null

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function trapFocus(panel: HTMLElement): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const els = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (els.length === 0) return
    const first = els[0], last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  panel.addEventListener('keydown', handler)
  return () => panel.removeEventListener('keydown', handler)
}

function getOrCreatePanel(): HTMLElement {
  if (panelEl) return panelEl
  panelEl = document.createElement('div')
  panelEl.className = 'detail-panel'
  panelEl.setAttribute('role', 'dialog')
  panelEl.setAttribute('aria-modal', 'true')
  panelEl.setAttribute('aria-labelledby', 'detail-panel-title')
  document.getElementById('map')!.appendChild(panelEl)
  return panelEl
}

export function openDetailPanel(feature: FeatureLike, trigger?: HTMLElement): void {
  triggerEl = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)

  const panel = getOrCreatePanel()
  panel.innerHTML = renderDetailContent(feature)
  // Force reflow before adding .open for transition
  void panel.offsetHeight
  panel.classList.add('open')

  const closeBtn = panel.querySelector<HTMLElement>('.detail-panel-close')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeDetailPanel(), { once: true })
    closeBtn.focus()
  }

  if (removeTrapFocus) removeTrapFocus()
  removeTrapFocus = trapFocus(panel)

  panel.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeDetailPanel() }
  }, { once: true })
}

export function closeDetailPanel(): void {
  if (removeTrapFocus) { removeTrapFocus(); removeTrapFocus = null }
  if (panelEl) {
    panelEl.classList.remove('open')
  }
  if (triggerEl) { triggerEl.focus(); triggerEl = null }
  if (closeCallback) {
    closeCallback()
  }
}

export function setupDetailPanel(map: maplibregl.Map, onClose: () => void): void {
  closeCallback = onClose

  // Close panel when clicking on map (not on a geology feature)
  // In local mode, the WMS click handler in info-panel manages the panel
  map.on('click', (e) => {
    if (store.getState().mode === 'local') return
    const features = map.queryRenderedFeatures(e.point, { layers: ['geology-fill'] })
    const dipFeatures = map.queryRenderedFeatures(e.point, { layers: ['dip-points'] })
    if (features.length === 0 && dipFeatures.length === 0) {
      closeDetailPanel()
    }
  })

  bus.on('mode:change', () => {
    closeDetailPanel()
  })
}
