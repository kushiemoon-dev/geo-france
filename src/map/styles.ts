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

export const faultsLayer: LayerSpecification = {
  id: 'faults',
  type: 'line',
  source: 'geology',
  'source-layer': 'L_STRUCT',
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

export const ALL_LAYERS = [
  geologyFillLayer,
  geologyOutlineLayer,
  faultsLayer,
  dipPointsLayer,
  dipLabelsLayer,
  surchargeLayer,
  geologyHighlightLayer
]
