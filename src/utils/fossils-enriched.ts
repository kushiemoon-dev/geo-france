import type { FossilGroups } from './geology-data.ts'
import enrichedData from '../config/fossils-enriched.json'

type EnrichedEntry = { groups: Record<string, string[]>; sources: string[] }
type EnrichedJson = {
  generated: string
  by_carte: Record<string, EnrichedEntry>
}

const data = enrichedData as EnrichedJson

const MAX_TERMS = 12

export function getEnrichedFossils(carte: string): FossilGroups {
  const key = carte ? carte.padStart(4, '0') : ''
  const entry = key ? (data.by_carte[key] ?? null) : null
  if (!entry) return {}
  const out: FossilGroups = {}
  for (const [group, terms] of Object.entries(entry.groups)) {
    out[group] = [...terms].slice(0, MAX_TERMS)
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
