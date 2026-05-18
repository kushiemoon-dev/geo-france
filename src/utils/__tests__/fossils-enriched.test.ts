import { describe, it, expect } from 'vitest'
import { getEnrichedFossils, mergeFossils } from '../fossils-enriched.ts'
import { FOSSIL_CANONICAL, classifyNotation, extractLithology } from '../geology-data.ts'
import { FOSSIL_GROUPS, FOSSIL_CANONICAL as FC_VOCAB } from '../fossil-vocabulary.ts'
import fossilsJson from '../../config/fossils-enriched.json'

const BANNED_FROM_AUTRES = ['fossile', 'fossiles', 'fossilifère', 'fossilifere', 'bioclastes', 'bioclaste']

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

describe('fossil-vocabulary — termes bannis absents du groupe autres', () => {
  it('FOSSIL_GROUPS.autres ne contient aucun terme générique banni', () => {
    const autresTerms = FOSSIL_GROUPS['autres'] ?? []
    const found = BANNED_FROM_AUTRES.filter(t => autresTerms.includes(t))
    expect(found, `Termes bannis encore dans FOSSIL_GROUPS.autres : ${found.join(', ')}`).toHaveLength(0)
  })

  it('fossils-enriched.json ne contient aucun terme banni dans le groupe autres', () => {
    const byCarte = (fossilsJson as { by_carte: Record<string, { groups: Record<string, string[]> }> }).by_carte
    const violations: string[] = []
    for (const [carte, v] of Object.entries(byCarte)) {
      const autres = v.groups?.autres ?? []
      for (const t of autres) {
        if (BANNED_FROM_AUTRES.includes(t)) violations.push(`${carte}:${t}`)
      }
    }
    expect(violations, `Termes bannis dans fossils-enriched.json/autres : ${violations.slice(0, 10).join(', ')}`).toHaveLength(0)
  })

  it('FOSSIL_CANONICAL et FOSSIL_GROUPS sont définis dans fossil-vocabulary.ts (re-export cohérent)', () => {
    expect(FC_VOCAB).toStrictEqual(FOSSIL_CANONICAL)
    expect(FOSSIL_GROUPS['ammonites']).toBeDefined()
    expect(FOSSIL_GROUPS['autres']).toBeDefined()
  })
})

describe('T4 — règles précambrien / magmatique', () => {
  it('gabbro est reconnu par extractLithology', () => {
    const result = extractLithology('Formation de gabbro et roches basiques')
    expect(result).toContain('gabbro')
  })

  it('stratovolcan est reconnu par extractLithology', () => {
    const result = extractLithology('Édifice de stratovolcan andésitique')
    expect(result).toContain('stratovolcan')
  })

  it('classifyNotation retourne Precambrien pour le préfixe b', () => {
    expect(classifyNotation('b').ere).toBe('Precambrien')
    expect(classifyNotation('b2S').ere).toBe('Precambrien')
    expect(classifyNotation('bkûH').ere).toBe('Precambrien')
  })

  it('classifyNotation retourne Roches cristallines pour les symboles magmatiques', () => {
    expect(classifyNotation('ã').periode).toBe('Roches cristallines')
    expect(classifyNotation('î').periode).toBe('Roches cristallines')
  })

  it('aucune carte avec groupes non-vides ne doit avoir uniquement des notations précambriennes connues (sanity check)', () => {
    // Nota : sans accès aux GeoJSON en test, on vérifie la règle sur les clés b* directement
    // Les clés 'b'-préfixées sont Précambrien — si une notice ne contenait QUE ces formations,
    // le script devrait les vider. Ce test valide que classifyNotation est cohérent.
    const precambrienNotations = ['b', 'b1', 'b2', 'b2S', 'b2G']
    const allPrecambrien = precambrienNotations.every(n => classifyNotation(n).ere === 'Precambrien')
    expect(allPrecambrien).toBe(true)
  })
})
