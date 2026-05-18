// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/geology-data.ts', () => ({
  classifyNotation: vi.fn((n: string) => ({
    ere: n.startsWith('b') ? 'Precambrien' : 'Mesozoique',
    periode: n.startsWith('b') ? 'Brioverien' : 'Jurassique',
    systeme: '', etage: '', color: '#ccc',
    ageStartMa: n.startsWith('b') ? 670 : 201,
    ageEndMa: n.startsWith('b') ? 538.8 : 145,
    summary: 'Test formation',
    wikiSlug: undefined,
  })),
  extractLithology: vi.fn(() => []),
  extractFossils: vi.fn(() => ({ ammonites: ['ammonite'] })),
  LITHO_WIKI_SLUGS: {},
  FOSSIL_TERM_WIKI_SLUGS: {},
}))

vi.mock('../../utils/fossils-enriched.ts', () => ({
  getEnrichedFossils: vi.fn(() => Promise.resolve({ ammonites: ['ammonite'] })),
  mergeFossils: vi.fn(() => ({ merged: { ammonites: ['ammonite'] }, enrichedSet: new Set(['ammonite']) })),
  prefetchEnrichedFossils: vi.fn(),
}))

vi.mock('../../utils/mineral-data.ts', () => ({
  getMineralInfo: vi.fn(() => undefined),
  getMineralBarColor: vi.fn(() => '#888'),
  getRockInfo: vi.fn(() => undefined),
  hasUsableImage: vi.fn(() => false),
  FORMATION_IMAGE_OVERRIDES: {
    b1Ph: { image: 'test-image.jpg' },
    b1: { image: 'test-image.jpg' },
    b2: { image: 'test-image.jpg' },
  },
}))

vi.mock('../../core/events.ts', () => ({
  bus: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
}))

vi.mock('../../core/state.ts', () => ({
  store: {
    getState: vi.fn(() => ({
      mode: 'national',
      regionId: 'bretagne',
      layers: {},
      detailOpen: false,
      loading: false,
    })),
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}))

describe('detail-panel — filtrage fossiles Précambrien', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="map"></div>'
  })

  it('ne rend PAS la section Fossiles pour une formation Briovérienne (b1Ph)', async () => {
    const { openDetailPanel } = await import('../detail-panel.ts')
    const feature = {
      properties: {
        NOTATION: 'b1Ph',
        DESCR: 'Siltites et argilites lustrées',
        LEGENDE: '',
        CARTE: '0123',
      },
    }
    openDetailPanel(feature as never)
    // Wait for the async renderDetailContent promise to resolve and update the DOM
    await new Promise(resolve => setTimeout(resolve, 0))
    const panel = document.querySelector('.detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.innerHTML).not.toContain('Fossiles')
    expect(panel!.innerHTML).not.toContain('fossil-group')
  })
})
