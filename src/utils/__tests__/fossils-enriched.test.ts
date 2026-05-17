import { describe, it, expect } from 'vitest'
import { getEnrichedFossils, mergeFossils } from '../fossils-enriched.ts'
import { FOSSIL_CANONICAL } from '../geology-data.ts'
import fossilsJson from '../../config/fossils-enriched.json'

describe('getEnrichedFossils', () => {
  it('retourne {} pour une carte vide', () => {
    expect(getEnrichedFossils('')).toEqual({})
  })

  it('retourne {} pour une carte inconnue', () => {
    expect(getEnrichedFossils('9999')).toEqual({})
  })

  it('zero-padding : "365" == "0365"', () => {
    const withPad = getEnrichedFossils('0365')
    const withoutPad = getEnrichedFossils('365')
    expect(withPad).toEqual(withoutPad)
  })

  it('zero-padding : "1" == "0001"', () => {
    const a = getEnrichedFossils('1')
    const b = getEnrichedFossils('0001')
    expect(a).toEqual(b)
  })
})

describe('mergeFossils', () => {
  it('fusionne groupes disjoints', () => {
    const extracted = { plantes: ['fougères'] }
    const enriched = { ammonites: ['ammonites'] }
    const { merged } = mergeFossils(extracted, enriched)
    expect(merged.plantes).toContain('fougères')
    expect(merged.ammonites).toContain('ammonites')
  })

  it('enrichedSet contient les termes nouveaux', () => {
    const extracted = {}
    const enriched = { ammonites: ['ammonites'] }
    const { enrichedSet } = mergeFossils(extracted, enriched)
    expect(enrichedSet.has('ammonites')).toBe(true)
  })

  it('ne duplique pas les termes déjà extraits', () => {
    const extracted = { ammonites: ['ammonites'] }
    const enriched = { ammonites: ['ammonites'] }
    const { merged, enrichedSet } = mergeFossils(extracted, enriched)
    expect(merged.ammonites).toHaveLength(1)
    expect(enrichedSet.has('ammonites')).toBe(false)
  })
})

describe('fossils-enriched.json — singulier uniquement', () => {
  it('aucun terme dans le JSON ne doit être une clé plurielle (FOSSIL_CANONICAL key → different value)', () => {
    const byCarte = (fossilsJson as { by_carte: Record<string, { groups: Record<string, string[]> }> }).by_carte
    const allTerms: string[] = Object.values(byCarte)
      .flatMap(v => Object.values(v.groups).flat())

    const violations = allTerms.filter(t => {
      const canonical = FOSSIL_CANONICAL[t]
      return canonical !== undefined && canonical !== t
    })

    expect(violations, `Termes pluriels non canonicalisés dans JSON : ${violations.slice(0, 10).join(', ')}`).toHaveLength(0)
  })
})
