import type { LayerSpecification } from 'maplibre-gl'
import { buildColorExpression } from '../utils/colors.ts'

export const geologyFillLayer: LayerSpecification = {
  id: 'geology-fill',
  type: 'fill',
  source: 'geology',
  'source-layer': 'S_FGEOL',
  paint: {
    'fill-color': buildColorExpression() as never,
    'fill-opacity': 0.65
  }
}

export const geologyOutlineLayer: LayerSpecification = {
  id: 'geology-outline',
  type: 'line',
  source: 'geology',
  'source-layer': 'L_FGEOL',
  paint: {
    'line-color': '#333333',
    'line-width': 0.5,
    'line-opacity': 0.6
  }
}

export const faultsMajorLayer: LayerSpecification = {
  id: 'faults-major',
  type: 'line',
  source: 'geology',
  'source-layer': 'L_STRUCT',
  filter: ['==', ['get', 'CODE'], 1],
  paint: {
    'line-color': '#CC0000',
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      8, 1,
      14, 3
    ],
    'line-opacity': 0.8,
    'line-dasharray': [4, 2]
  }
}

export const faultsMinorLayer: LayerSpecification = {
  id: 'faults-minor',
  type: 'line',
  source: 'geology',
  'source-layer': 'L_STRUCT',
  filter: ['==', ['get', 'CODE'], 2],
  minzoom: 8,
  paint: {
    'line-color': '#CC0000',
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      8, 1,
      14, 3
    ],
    'line-opacity': 0.8,
    'line-dasharray': [4, 2]
  }
}

export const dipPointsLayer: LayerSpecification = {
  id: 'dip-points',
  type: 'symbol',
  source: 'geology',
  'source-layer': 'P_STRUCT',
  filter: ['all', ['has', 'AZIMUT'], ['!=', ['get', 'PENDAGE'], 999]],
  layout: {
    'icon-image': 'dip-symbol',
    'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 14, 1.2],
    'icon-rotate': ['get', 'AZIMUT'],
    'icon-rotation-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
  paint: {
    'icon-color': '#000000',
    'icon-halo-color': '#ffffff',
    'icon-halo-width': 1,
  },
  minzoom: 8
}

export const surchargeLayer: LayerSpecification = {
  id: 'surcharge',
  type: 'fill',
  source: 'geology',
  'source-layer': 'S_SURCH',
  minzoom: 7,
  paint: {
    'fill-color': '#9933CC',
    'fill-opacity': 0.25,
    'fill-outline-color': '#9933CC'
  }
}

export const dipLabelsLayer: LayerSpecification = {
  id: 'dip-labels',
  type: 'symbol',
  source: 'geology',
  'source-layer': 'P_STRUCT',
  filter: ['all', ['has', 'PENDAGE'], ['!=', ['get', 'PENDAGE'], 999]],
  layout: {
    'text-field': ['concat', ['to-string', ['get', 'PENDAGE']], '°'],
    'text-size': 11,
    'text-offset': [1, 0],
    'text-anchor': 'left',
    'text-allow-overlap': false
  },
  paint: {
    'text-color': '#1a1a1a',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5
  },
  minzoom: 8
}

export const geologyHighlightLayer: LayerSpecification = {
  id: 'geology-highlight',
  type: 'line',
  source: 'geology',
  'source-layer': 'S_FGEOL',
  paint: {
    'line-color': '#FFFFFF',
    'line-width': 3,
    'line-opacity': 0.9
  },
  filter: ['==', 'OBJECTID', '']
}

export const formationLabelsLayer: LayerSpecification = {
  id: 'formation-labels',
  type: 'symbol',
  source: 'geology',
  'source-layer': 'S_FGEOL',
  minzoom: 10,
  layout: {
    'text-field': ['coalesce', ['get', 'NOTATION'], ''],
    'text-size': 11,
    'text-anchor': 'center',
    'text-allow-overlap': false,
    'text-ignore-placement': false,
  },
  paint: {
    'text-color': '#1a1a1a',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5
  }
}

export const ALL_LAYERS = [
  geologyFillLayer,
  geologyOutlineLayer,
  faultsMajorLayer,
  faultsMinorLayer,
  dipPointsLayer,
  dipLabelsLayer,
  surchargeLayer,
  geologyHighlightLayer,
  formationLabelsLayer,
]

// ── National France view (LITHO_1M_SIMPLIFIEE, CODE_GEOL integer) ──────────

const NATIONAL_CODE_COLORS: [number, string][] = [
  [1,  '#F9F97F'],  // Clays → Quaternary
  [2,  '#80CFFF'],  // Limestones/marls → Jurassic
  [3,  '#A6D468'],  // Chalk → Cretaceous
  [5,  '#CB8C37'],  // Sandstone → Devonian
  [6,  '#FFFF00'],  // Sands → Neogene
  [7,  '#CC4400'],  // Basalts/Rhyolites → volcanic
  [8,  '#E36DAA'],  // Granites → Crystalline rocks
  [9,  '#9B59B6'],  // Ophiolites → metamorphic
  [10, '#D070D0'],  // Gneiss → metamorphic
  [11, '#D070D0'],  // Mica schists → metamorphic
  [12, '#B3E1B6'],  // Schists/Sandstone → Paleozoic
]

function buildNationalColorExpression(): unknown {
  const parts: unknown[] = ['match', ['to-number', ['get', 'CODE_GEOL']]]
  for (const [code, color] of NATIONAL_CODE_COLORS) {
    parts.push(code, color)
  }
  parts.push('#CCCCCC')
  return parts
}

export const NATIONAL_LAYER_IDS = ['geology-fill__france', 'geology-outline__france']

export function createNationalLayers(): LayerSpecification[] {
  return [
    {
      id: 'geology-fill__france',
      type: 'fill',
      source: 'geology-france',
      'source-layer': 'S_FGEOL_1M',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': buildNationalColorExpression() as never,
        'fill-opacity': 0.75,
      },
    },
    {
      id: 'geology-outline__france',
      type: 'line',
      source: 'geology-france',
      'source-layer': 'S_FGEOL_1M',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#333333',
        'line-width': 0.5,
        'line-opacity': 0.6,
      },
    },
  ] as LayerSpecification[]
}

export function createLayersForRegion(regionId: string): LayerSpecification[] {
  const sourceId = `geology-${regionId}`
  return ALL_LAYERS.map(layer => {
    const cloned = { ...layer, id: `${layer.id}__${regionId}`, source: sourceId } as LayerSpecification
    const existingLayout = (layer as { layout?: Record<string, unknown> }).layout ?? {}
    ;(cloned as Record<string, unknown>).layout = { ...existingLayout, visibility: 'none' }
    return cloned
  })
}

export function getRegionLayerIds(regionId: string): string[] {
  return ALL_LAYERS.map(l => `${l.id}__${regionId}`)
}

export function getRegionLayerId(baseId: string, regionId: string): string {
  return `${baseId}__${regionId}`
}
