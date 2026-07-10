import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

vi.mock('../styles.ts', () => ({
  createLayersForRegion: vi.fn((regionId: string) => [
    { id: `geology-fill-${regionId}`, type: 'fill', source: `geology-${regionId}`, 'source-layer': 'geology', paint: {} },
    { id: `geology-line-${regionId}`, type: 'line', source: `geology-${regionId}`, 'source-layer': 'geology', paint: {} },
  ]),
  getRegionLayerIds: vi.fn((regionId: string) => [
    `geology-fill-${regionId}`,
    `geology-line-${regionId}`,
  ]),
}))

vi.mock('../map-mode.ts', () => ({
  ensureModeAfterRegionLoad: vi.fn(),
}))

vi.mock('../../ui/shared/loading.ts', () => ({
  showMapLoading: vi.fn(),
  hideMapLoading: vi.fn(),
}))

vi.mock('../../ui/shared/toast.ts', () => ({
  showToast: vi.fn(),
}))

vi.mock('../../core/state.ts', () => ({
  store: { setState: vi.fn() },
}))

vi.mock('../../core/events.ts', () => ({
  bus: { emit: vi.fn() },
}))

// --- Map stub factory ---

function makeMap() {
  const sources = new Map<string, object>()
  const layers = new Map<string, object>()
  const listeners = new Map<string, ((e: object) => void)[]>()

  return {
    addSource: vi.fn((id: string, spec: object) => { sources.set(id, spec) }),
    getSource: vi.fn((id: string) => sources.get(id) ?? null),
    addLayer: vi.fn((layer: { id: string }) => { layers.set(layer.id, layer) }),
    getLayer: vi.fn((id: string) => layers.get(id) ?? null),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
    isSourceLoaded: vi.fn(() => true),
    fitBounds: vi.fn(),
    on: vi.fn((event: string, cb: (e: object) => void) => {
      const list = listeners.get(event) ?? []
      list.push(cb)
      listeners.set(event, list)
    }),
    off: vi.fn((event: string, cb: (e: object) => void) => {
      const list = listeners.get(event) ?? []
      listeners.set(event, list.filter(fn => fn !== cb))
    }),
    _sources: sources,
    _layers: layers,
  }
}

// --- Tests ---

describe('region-manager', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  describe('initRegions', () => {
    it('Cas 1 — france: ajoute les 13 sources', async () => {
      const { initRegions, _resetInitializedRegions } = await import('../region-manager.ts')
      _resetInitializedRegions()
      const map = makeMap()

      initRegions(map as never, 'france')

      // DATA_REGIONS has 13 entries
      expect(map.addSource).toHaveBeenCalledTimes(13)
    })

    it('Cas 2 — bretagne: ajoute seulement 1 source', async () => {
      const { initRegions, _resetInitializedRegions } = await import('../region-manager.ts')
      _resetInitializedRegions()
      const map = makeMap()

      initRegions(map as never, 'bretagne')

      expect(map.addSource).toHaveBeenCalledTimes(1) // geology-bretagne
      expect(map.addSource).toHaveBeenCalledWith('geology-bretagne', expect.objectContaining({
        url: 'pmtiles:///data/bretagne.pmtiles',
      }))
    })

    it('Cas 2b — idempotent: appeler deux fois n\'ajoute pas de doublon', async () => {
      const { initRegions, _resetInitializedRegions } = await import('../region-manager.ts')
      _resetInitializedRegions()
      const map = makeMap()

      initRegions(map as never, 'bretagne')
      initRegions(map as never, 'bretagne')

      expect(map.addSource).toHaveBeenCalledTimes(1) // geology-bretagne, no duplicates
    })
  })

  describe('ensureRegionInitialized', () => {
    it('Cas 3 — normandie non initialisée: ajoute la source', async () => {
      const { initRegions, ensureRegionInitialized, _resetInitializedRegions } = await import('../region-manager.ts')
      _resetInitializedRegions()
      const map = makeMap()
      map.isSourceLoaded.mockReturnValue(true)

      initRegions(map as never, 'bretagne')
      await ensureRegionInitialized(map as never, 'normandie')

      const addedSources = map.addSource.mock.calls.map((c: [string, object]) => c[0])
      expect(addedSources).toContain('geology-bretagne')
      expect(addedSources).toContain('geology-normandie')
      expect(map.addSource).toHaveBeenCalledTimes(2)
    })

    it('Cas 3b — région déjà initialisée: n\'ajoute pas de doublon', async () => {
      const { initRegions, ensureRegionInitialized, _resetInitializedRegions } = await import('../region-manager.ts')
      _resetInitializedRegions()
      const map = makeMap()

      initRegions(map as never, 'bretagne')
      await ensureRegionInitialized(map as never, 'bretagne')

      expect(map.addSource).toHaveBeenCalledTimes(1) // geology-bretagne
    })
  })

  describe('loadRegion — france', () => {
    it('Cas 4 — depuis bretagne vers france: initialise les 12 manquantes', async () => {
      const { initRegions, loadRegion, _resetInitializedRegions } = await import('../region-manager.ts')
      _resetInitializedRegions()
      const map = makeMap()
      map.isSourceLoaded.mockReturnValue(true)

      initRegions(map as never, 'bretagne')
      expect(map.addSource).toHaveBeenCalledTimes(1) // geology-bretagne

      // Switching to france view initializes the 12 missing regions
      await loadRegion(map as never, 'france')

      expect(map.addSource).toHaveBeenCalledTimes(13) // 12 missing regions + geology-bretagne
    })
  })
})
