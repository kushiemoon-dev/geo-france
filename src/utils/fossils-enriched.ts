import { FOSSIL_CANONICAL } from './geology-data.ts'
import type { FossilGroups } from './geology-data.ts'

type EnrichedEntry = { groups: Record<string, string[]>; sources: string[] }
type EnrichedJson = {
  generated: string
  by_carte: Record<string, EnrichedEntry>
}

const MAX_TERMS = 12

let cache: Promise<EnrichedJson> | null = null

function loadEnrichedData(): Promise<EnrichedJson> {
  if (!cache) {
    cache = import('../config/fossils-enriched.json').then(m => m.default as EnrichedJson)
  }
  return cache
}

export function prefetchEnrichedFossils(): void {
  loadEnrichedData()
}

/**
 * Convert a raw CARTE field value from PMTiles features to a fossils-enriched.json key.
 *
 * The BD Charm-50 PMTiles encode the BRGM sheet number with a +2000 offset
 * (e.g. sheet 0479 → CARTE "2479", sheet 0244 → CARTE "2244").
 * fossils-enriched.json is indexed by the raw 4-digit sheet number ("0479", "0244"…).
 */
function carteToNoticeKey(carte: string): string {
  if (!carte) return ''
  const n = parseInt(carte, 10)
  if (isNaN(n)) return ''
  const noticeNum = n >= 2000 ? n - 2000 : n
  return String(noticeNum).padStart(4, '0')
}

export async function getEnrichedFossils(carte: string): Promise<FossilGroups> {
  const data = await loadEnrichedData()
  const key = carteToNoticeKey(carte)
  const entry = key ? (data.by_carte[key] ?? null) : null
  if (!entry) return {}
  const out: FossilGroups = {}
  for (const [group, terms] of Object.entries(entry.groups)) {
    const mapped = [...terms].map(t => FOSSIL_CANONICAL[t] ?? t)
    const deduped = [...new Set(mapped)]
    out[group] = deduped.slice(0, MAX_TERMS)
  }
  return out
}

export function mergeFossils(extracted: FossilGroups, enriched: FossilGroups): {
  merged: FossilGroups
  enrichedSet: Set<string>
} {
  const merged: FossilGroups = { ...extracted }
  const enrichedSet = new Set<string>()

  for (const [group, terms] of Object.entries(enriched)) {
    const existing = new Set(extracted[group] ?? [])
    const newTerms = terms.filter(t => !existing.has(t))
    newTerms.forEach(t => enrichedSet.add(t))
    if (newTerms.length === 0 && !merged[group]) continue
    if (!merged[group]) {
      merged[group] = newTerms.slice(0, MAX_TERMS)
    } else {
      merged[group] = [...new Set([...merged[group], ...newTerms])].slice(0, MAX_TERMS)
    }
  }

  return { merged, enrichedSet }
}
