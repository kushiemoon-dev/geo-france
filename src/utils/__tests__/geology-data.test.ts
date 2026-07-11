import { describe, it, expect } from 'vitest'
import { extractFossils, extractLithology, classifyNotation, filterFossilsByAge } from '../geology-data.ts'

describe('extractFossils', () => {
  it('détecte les ammonites dans un nom de formation', () => {
    const result = extractFossils('Calcaire à ammonites du Jurassique')
    expect(Object.values(result).flat()).toContain('ammonite')
  })

  it('détecte les bivalves', () => {
    const result = extractFossils('Marnes à huîtres et bivalves')
    expect(Object.values(result).flat().some(t => ['huître', 'bivalve'].includes(t))).toBe(true)
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

describe('filterFossilsByAge', () => {
  it('retire les ammonites (Jurassique-Crétacé) sur une formation cambrienne', () => {
    const result = filterFossilsByAge(
      { ammonites: ['ammonite'], trilobites: ['trilobite'] },
      538.8, 485.4, // Cambrien
    )
    expect(result.ammonites).toBeUndefined()
    expect(result.trilobites).toEqual(['trilobite'])
  })

  it('retire les trilobites (éteints fin-Permien) sur une formation crétacée', () => {
    const result = filterFossilsByAge(
      { trilobites: ['trilobite'], rudistes: ['rudiste'] },
      145.0, 66.0, // Cretace
    )
    expect(result.trilobites).toBeUndefined()
    expect(result.rudistes).toEqual(['rudiste'])
  })

  it('laisse passer sans filtrage si âge de la formation inconnu', () => {
    const fossils = { ammonites: ['ammonite'], trilobites: ['trilobite'] }
    expect(filterFossilsByAge(fossils, undefined, undefined)).toEqual(fossils)
  })

  it('laisse passer un groupe sans intervalle connu (ex. "genres")', () => {
    const result = filterFossilsByAge({ genres: ['Ammonites'] }, 538.8, 485.4)
    expect(result.genres).toEqual(['Ammonites'])
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

  it('détecte flysch et molasse (faciès alpins Cénozoïque/Paléogène)', () => {
    expect(extractLithology('Flyschs indifférenciés (des Aiguilles d\'Arves)')).toContain('flysch')
    expect(extractLithology('Molasse rouge du Bas-Dauphiné')).toContain('molasse')
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
