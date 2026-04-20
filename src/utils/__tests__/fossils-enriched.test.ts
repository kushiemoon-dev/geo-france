import { describe, it, expect } from 'vitest'
import { getEnrichedFossils, mergeFossils } from '../fossils-enriched.ts'

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
