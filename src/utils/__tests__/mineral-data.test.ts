import { describe, it, expect } from 'vitest'
import { getRockInfo, hasUsableImage, getMineralInfo } from '../mineral-data.ts'

describe('getRockInfo', () => {
  it('retourne les infos pour une roche connue', () => {
    const info = getRockInfo('granite')
    expect(info).toBeDefined()
    expect(info?.type).toBe('magmatique')
  })

  it('est insensible à la casse', () => {
    expect(getRockInfo('Granite')).toEqual(getRockInfo('granite'))
  })

  it('retourne undefined pour une roche inconnue', () => {
    expect(getRockInfo('roche_inexistante_xyz')).toBeUndefined()
  })
})

describe('hasUsableImage', () => {
  it('retourne false si info undefined', () => {
    expect(hasUsableImage(undefined)).toBe(false)
  })

  it('retourne false si pas d\'image', () => {
    expect(hasUsableImage({ type: 'test', origin: 'test', minerals: [] })).toBe(false)
  })

  it('retourne false si imageStatus quarantined', () => {
    expect(hasUsableImage({ type: 'test', origin: 'test', minerals: [], image: '/foo.jpg', imageStatus: 'quarantined' })).toBe(false)
  })

  it('retourne true si image présente et non quarantinée', () => {
    expect(hasUsableImage({ type: 'test', origin: 'test', minerals: [], image: '/foo.jpg' })).toBe(true)
  })
})

describe('getMineralInfo', () => {
  it('retourne les infos pour la calcite', () => {
    const info = getMineralInfo('calcite')
    expect(info?.formula).toContain('CaCO')
  })

  it('supporte les alias accentués', () => {
    expect(getMineralInfo('disthène')).toEqual(getMineralInfo('disthene'))
  })
})
