import { describe, it, expect } from 'vitest'
import { createLayersForRegion, faultsMajorLayer, faultsMinorLayer, surchargeLayer, geologyOutlineLayer } from '../styles.ts'
import type { LayerSpecification } from 'maplibre-gl'

describe('faultsMajorLayer', () => {
  it('a le filtre CODE = 1', () => {
    expect((faultsMajorLayer as Record<string, unknown>).filter).toEqual(['==', ['get', 'CODE'], 1])
  })

  it('n\'a pas de minzoom', () => {
    expect((faultsMajorLayer as Record<string, unknown>).minzoom).toBeUndefined()
  })
})

describe('faultsMinorLayer', () => {
  it('a le filtre CODE = 2', () => {
    expect((faultsMinorLayer as Record<string, unknown>).filter).toEqual(['==', ['get', 'CODE'], 2])
  })

  it('a minzoom: 8', () => {
    expect((faultsMinorLayer as Record<string, unknown>).minzoom).toBe(8)
  })
})

describe('surchargeLayer', () => {
  it('a minzoom: 7', () => {
    expect((surchargeLayer as Record<string, unknown>).minzoom).toBe(7)
  })
})

describe('createLayersForRegion', () => {
  it('génère faults-major__bretagne avec filter CODE = 1', () => {
    const layers = createLayersForRegion('bretagne')
    const major = layers.find(l => l.id === 'faults-major__bretagne')
    expect(major).toBeDefined()
    expect((major as Record<string, unknown>).filter).toEqual(['==', ['get', 'CODE'], 1])
  })

  it('génère faults-minor__bretagne avec minzoom 8', () => {
    const layers = createLayersForRegion('bretagne')
    const minor = layers.find(l => l.id === 'faults-minor__bretagne')
    expect(minor).toBeDefined()
    expect((minor as Record<string, unknown>).minzoom).toBe(8)
  })

  it('génère surcharge__bretagne avec minzoom 7', () => {
    const layers = createLayersForRegion('bretagne')
    const surcharge = layers.find(l => l.id === 'surcharge__bretagne')
    expect(surcharge).toBeDefined()
    expect((surcharge as Record<string, unknown>).minzoom).toBe(7)
  })

  it('ne génère pas de layer faults__bretagne (ancien nom)', () => {
    const layers = createLayersForRegion('bretagne')
    const old = layers.find(l => l.id === 'faults__bretagne')
    expect(old).toBeUndefined()
  })

  it('assigne la bonne source à chaque layer', () => {
    const layers = createLayersForRegion('bretagne')
    for (const layer of layers) {
      expect((layer as LayerSpecification & { source: string }).source).toBe('geology-bretagne')
    }
  })

  it('préserve line-join/line-cap round sur geology-outline cloné (contours lissés)', () => {
    const layers = createLayersForRegion('bretagne')
    const outline = layers.find(l => l.id === 'geology-outline__bretagne')
    expect(outline).toBeDefined()
    const layout = (outline as LayerSpecification & { layout: Record<string, unknown> }).layout
    expect(layout['line-join']).toBe('round')
    expect(layout['line-cap']).toBe('round')
  })
})

describe('geologyOutlineLayer', () => {
  it('a line-join et line-cap round', () => {
    const layout = (geologyOutlineLayer as LayerSpecification & { layout: Record<string, unknown> }).layout
    expect(layout['line-join']).toBe('round')
    expect(layout['line-cap']).toBe('round')
  })

  it('a minzoom: 8 (évite la surdensité de ~1M bordures en vue nationale)', () => {
    expect((geologyOutlineLayer as Record<string, unknown>).minzoom).toBe(8)
  })
})

describe('createLayersForRegion — geology-outline', () => {
  it('préserve minzoom: 8 sur le clone régional', () => {
    const layers = createLayersForRegion('bretagne')
    const outline = layers.find(l => l.id === 'geology-outline__bretagne')
    expect((outline as Record<string, unknown>).minzoom).toBe(8)
  })
})
