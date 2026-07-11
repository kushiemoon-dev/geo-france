// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractLithology, extractFossils } from '../../utils/geology-data.ts'
import { getEnrichedFossils } from '../../utils/fossils-enriched.ts'
import { getRockInfo } from '../../utils/mineral-data.ts'

// Default classification: fossiliferous sedimentary formation (Jurassic),
// except notation 'b*' (Briovérien/Precambrian), 'cristallin*' (Roches cristallines),
// 'cambrien*' or 'cretace*' (ages used to test filterFossilsByAge) —
// overridable per test via mockReturnValueOnce. filterFossilsByAge, mergeFossils,
// and SORTED_RULES stay the real implementation (importOriginal): they're what
// we want to exercise, not stand-ins.
vi.mock('../../utils/geology-data.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('../../utils/geology-data.ts')>()
  return {
    ...actual,
    classifyNotation: vi.fn((n: string) => {
      if (n.startsWith('b')) {
        return { ere: 'Precambrien', periode: 'Brioverien', systeme: '', etage: '', color: '#ccc', ageStartMa: 670, ageEndMa: 538.8, summary: 'Test formation', wikiSlug: undefined }
      }
      if (n.startsWith('cristallin')) {
        return { ere: '', periode: 'Roches cristallines', systeme: '', etage: '', color: '#ccc', summary: 'Test formation', wikiSlug: undefined }
      }
      if (n.startsWith('cambrien')) {
        return { ere: 'Paleozoique', periode: 'Cambrien', systeme: '', etage: '', color: '#ccc', ageStartMa: 538.8, ageEndMa: 485.4, summary: 'Test formation', wikiSlug: undefined }
      }
      if (n.startsWith('cretace')) {
        return { ere: 'Mesozoique', periode: 'Cretace', systeme: '', etage: '', color: '#ccc', ageStartMa: 145.0, ageEndMa: 66.0, summary: 'Test formation', wikiSlug: undefined }
      }
      return { ere: 'Mesozoique', periode: 'Jurassique', systeme: '', etage: '', color: '#ccc', ageStartMa: 201, ageEndMa: 145, summary: 'Test formation', wikiSlug: undefined }
    }),
    extractLithology: vi.fn(() => []),
    extractFossils: vi.fn(() => ({ ammonites: ['ammonite'] })),
  }
})

vi.mock('../../utils/fossils-enriched.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('../../utils/fossils-enriched.ts')>()
  return {
    ...actual,
    getEnrichedFossils: vi.fn(() => Promise.resolve({ ammonites: ['ammonite'] })),
    prefetchEnrichedFossils: vi.fn(),
  }
})

vi.mock('../../utils/mineral-data.ts', () => ({
  getMineralInfo: vi.fn(() => undefined),
  getMineralBarColor: vi.fn(() => '#888'),
  getRockInfo: vi.fn(() => undefined),
  hasUsableImage: vi.fn(() => false),
  FORMATION_IMAGE_OVERRIDES: {
    b1Ph: { image: 'test-image.jpg' },
    b1S: { image: 'test-image.jpg' },
    b1: { image: 'test-image.jpg' },
    b2: { image: 'test-image.jpg' },
  },
}))

vi.mock('../../config/notices.ts', () => ({
  NOTICES: { bretagne: [] },
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
    // detail-panel.ts keeps a module-level singleton (panelEl) attached to the
    // previous DOM — without a reset, tests after the first one find a detached
    // node and querySelector('.detail-panel') fails silently.
    vi.resetModules()
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

  it('ne rend PAS la section Fossiles pour une roche cristalline (granodiorite cadomienne, ere non-Precambrien)', async () => {
    const { openDetailPanel } = await import('../detail-panel.ts')
    // Real reported case: "Granodiorites cadomiennes à biotite et cordiérite" —
    // classifies as 'Roches cristallines' with ere:'' (NOT 'Precambrien'), so
    // only the isCrystallineNotation guard (periode) must block the fossils.
    const feature = {
      properties: {
        NOTATION: 'cristallinÈæ',
        DESCR: 'Granodiorites cadomiennes à biotite et cordiérite',
        LEGENDE: '',
        CARTE: '0123',
      },
    }
    openDetailPanel(feature as never)
    await new Promise(resolve => setTimeout(resolve, 0))
    const panel = document.querySelector('.detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.innerHTML).not.toContain('Fossiles')
    expect(panel!.innerHTML).not.toContain('fossil-group')
  })

  it('ne rend PAS la section Fossiles pour une lithologie métamorphique (schiste), même à âge non-Précambrien', async () => {
    vi.mocked(extractLithology).mockReturnValueOnce(['schiste'])
    vi.mocked(getRockInfo).mockReturnValueOnce({ type: 'metamorphique' } as never)
    const { openDetailPanel } = await import('../detail-panel.ts')
    // Real reported case: "Schistes d'Urville" — non-Precambrian age but a
    // metamorphic rock, must be blocked by the lithology guard (hasCrystallineLitho).
    const feature = {
      properties: {
        NOTATION: 'k1',
        DESCR: 'Schistes d\'Urville',
        LEGENDE: '',
        CARTE: '0123',
      },
    }
    openDetailPanel(feature as never)
    await new Promise(resolve => setTimeout(resolve, 0))
    const panel = document.querySelector('.detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.innerHTML).not.toContain('Fossiles')
    expect(panel!.innerHTML).not.toContain('fossil-group')
  })

  it('affiche la section Fossiles pour une formation sédimentaire fossilifère (non-régression)', async () => {
    vi.mocked(extractLithology).mockReturnValueOnce(['calcaire'])
    vi.mocked(getRockInfo).mockReturnValueOnce({ type: 'sedimentaire' } as never)
    const { openDetailPanel } = await import('../detail-panel.ts')
    const feature = {
      properties: {
        NOTATION: 'j3',
        DESCR: 'Calcaires oolithiques à ammonites',
        LEGENDE: '',
        CARTE: '0123',
      },
    }
    openDetailPanel(feature as never)
    await new Promise(resolve => setTimeout(resolve, 0))
    const panel = document.querySelector('.detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.innerHTML).toContain('Fossiles')
    expect(panel!.innerHTML).toContain('fossil-group')
  })

  it('filtre les ammonites (bleeding feuille BRGM) sur une formation cambrienne, garde les trilobites', async () => {
    vi.mocked(extractFossils).mockReturnValueOnce({})
    vi.mocked(getEnrichedFossils).mockResolvedValueOnce({ ammonites: ['ammonite'], trilobites: ['trilobite'] })
    const { openDetailPanel } = await import('../detail-panel.ts')
    const feature = {
      properties: {
        NOTATION: 'cambrienK1',
        DESCR: 'Grès et schistes à trilobites',
        LEGENDE: '',
        CARTE: '0123',
      },
    }
    openDetailPanel(feature as never)
    await new Promise(resolve => setTimeout(resolve, 0))
    const panel = document.querySelector('.detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.innerHTML).toContain('trilobite')
    expect(panel!.innerHTML).not.toContain('ammonite')
  })

  it('filtre les trilobites (bleeding feuille BRGM) sur une formation crétacée, garde les rudistes', async () => {
    vi.mocked(extractFossils).mockReturnValueOnce({})
    vi.mocked(getEnrichedFossils).mockResolvedValueOnce({ trilobites: ['trilobite'], rudistes: ['rudiste'] })
    const { openDetailPanel } = await import('../detail-panel.ts')
    const feature = {
      properties: {
        NOTATION: 'cretaceN1',
        DESCR: 'Calcaires urgoniens à rudistes',
        LEGENDE: '',
        CARTE: '0123',
      },
    }
    openDetailPanel(feature as never)
    await new Promise(resolve => setTimeout(resolve, 0))
    const panel = document.querySelector('.detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.innerHTML).toContain('rudiste')
    expect(panel!.innerHTML).not.toContain('trilobite')
  })
})
