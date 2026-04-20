import { describe, it, expect } from 'vitest'
import { extractFossils, extractLithology, classifyNotation } from '../geology-data.ts'

describe('extractFossils', () => {
  it('détecte les ammonites dans un nom de formation', () => {
    const result = extractFossils('Calcaire à ammonites du Jurassique')
    expect(Object.values(result).flat()).toContain('ammonites')
  })

  it('détecte les bivalves', () => {
    const result = extractFossils('Marnes à huîtres et bivalves')
    expect(Object.values(result).flat().some(t => ['huîtres', 'huitres', 'bivalves'].includes(t))).toBe(true)
  })

  it('retourne {} si texte vide', () => {
    expect(extractFossils('')).toEqual({})
  })

  it('est insensible à la casse', () => {
    const lower = extractFossils('calcaire à ammonites')
    const upper = extractFossils('Calcaire à AMMONITES')
    expect(Object.values(lower).flat()).toEqual(Object.values(upper).flat())
  })
})

describe('extractLithology', () => {
  it('détecte le calcaire', () => {
    expect(extractLithology('Calcaire bioclastique')).toContain('calcaire')
  })

  it('détecte le grès', () => {
    expect(extractLithology('Grès fin argileux')).toContain('grès')
  })

  it('retourne [] si texte vide', () => {
    expect(extractLithology('')).toEqual([])
  })

  it('fusionne plusieurs sources', () => {
    const result = extractLithology('calcaire', 'schiste')
    expect(result).toContain('calcaire')
    expect(result).toContain('schiste')
  })
})

describe('classifyNotation', () => {
  it('classifie le Jurassique (j)', () => {
    const entry = classifyNotation('j3')
    expect(entry.ere).toBeTruthy()
  })

  it('classifie le Crétacé (c)', () => {
    const entry = classifyNotation('c2')
    expect(entry.ere).toBeTruthy()
  })

  it('retourne un fallback pour notation inconnue', () => {
    const entry = classifyNotation('zzz999')
    expect(entry).toBeDefined()
    expect(entry.color).toBeDefined()
  })

  it('gère les notations parenthésées', () => {
    const entry = classifyNotation('(b2-r)LM')
    expect(entry).toBeDefined()
  })
})
