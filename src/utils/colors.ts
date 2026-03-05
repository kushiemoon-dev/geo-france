// Build a MapLibre expression that maps NOTATION prefixes to ICS colors
// Uses case expressions with string prefix matching (longest prefix first)

import type { ExpressionSpecification } from 'maplibre-gl'

type CaseEntry = readonly [prefixes: readonly string[], color: string]

// Ordered longest-prefix-first within each group
const COLOR_RULES: readonly CaseEntry[] = [
  // Multi-char prefixes first
  [['Hydro', 'GLB'], '#C8E8FF'],
  [['SGH'], '#F9F97F'],
  [['SL', 'VL'], '#C8E8FF'],
  [['SC', 'CF', 'LP', 'OE', 'Tz'], '#F9F97F'],
  [['Fz', 'Fy', 'Fx', 'Fw', 'Fv', 'Fu'], '#F9F97F'],
  [['B-'], '#F9F97F'],

  // Eocene subdivisions
  [['e7'], '#FDB46C'],
  [['e6'], '#FDB46C'],
  [['e5'], '#FDB46C'],
  [['e3', 'e4'], '#FDB46C'],
  [['e1', 'e2'], '#FDB46C'],

  // Cretace superieur
  [['c6'], '#BFE48A'],
  [['c5', 'c4'], '#E2F2B0'],
  [['c3'], '#BFE48A'],
  [['c2', 'c1'], '#A6D468'],

  // Cretace inferieur
  [['n6', 'n5'], '#7ECD74'],

  // Jurassique superieur
  [['j7', 'j6', 'j5'], '#B3D4FF'],
  // Jurassique moyen
  [['j4', 'j3'], '#80CFFF'],
  // Jurassique inferieur
  [['j2', 'j1'], '#34B2E8'],

  // Lias
  [['l4', 'l3', 'l2', 'l1'], '#34B2E8'],

  // Single-char periods (after longer prefixes)
  [['e'], '#FDB46C'],
  [['c'], '#A6D468'],
  [['j', 'l'], '#34B2E8'],
  [['p'], '#FFFF99'],
  [['m'], '#FFFF00'],
  [['g'], '#FDC07A'],
  [['t'], '#812B92'],
  [['r'], '#F04028'],
  [['h'], '#67A599'],
  [['d'], '#CB8C37'],
  [['s'], '#B3E1B6'],
  [['o'], '#009270'],
  [['k'], '#7FA08C'],
  [['b'], '#F4B8D4'],

  // Roches cristallines
  [['ã', 'î', 'ó', 'Ã', 'Õ', 'ñ', 'Å', 'Û'], '#E36DAA'],

  // Quaternaire catch-all
  [['q', 'F', 'C', 'D', 'E', 'K', 'S', 'U', 'X', 'R'], '#F9F97F'],
  [['°', '³'], '#F9F97F'],

  // Alterites
  [['¡'], '#E8D0A0'],
]

function prefixCondition(prefix: string): ExpressionSpecification {
  const len = prefix.length
  return ['==', ['slice', ['get', 'NOTATION'], 0, len], prefix] as ExpressionSpecification
}

export function buildColorExpression(): ExpressionSpecification {
  // Build: ['case', cond1, color1, cond2, color2, ..., fallback]
  const parts: unknown[] = ['case']

  for (const [prefixes, color] of COLOR_RULES) {
    if (prefixes.length === 1) {
      parts.push(prefixCondition(prefixes[0]), color)
    } else {
      // OR multiple prefix checks
      const conditions = prefixes.map(p => prefixCondition(p))
      parts.push(['any', ...conditions], color)
    }
  }

  parts.push('#CCCCCC') // fallback
  return parts as ExpressionSpecification
}

// Legend entries based on ICS geological period colors (with sub-periods)
export const LEGEND_PERIODS = [
  { label: 'Quaternaire', color: '#F9F97F' },
  { label: 'Neogene', color: '#FFE619' },
  { label: 'Paleogene', color: '#FD9A52' },
  { label: 'Cretace sup.', color: '#A6D468' },
  { label: 'Cretace inf.', color: '#7ECD74' },
  { label: 'Jur. sup.', color: '#B3D4FF' },
  { label: 'Jur. moy.', color: '#80CFFF' },
  { label: 'Jur. inf.', color: '#34B2E8' },
  { label: 'Trias', color: '#812B92' },
  { label: 'Permien', color: '#F04028' },
  { label: 'Carbonifere', color: '#67A599' },
  { label: 'Devonien', color: '#CB8C37' },
  { label: 'Silurien', color: '#B3E1B6' },
  { label: 'Ordovicien', color: '#009270' },
  { label: 'Cambrien', color: '#7FA08C' },
  { label: 'Brioverien', color: '#F4B8D4' },
  { label: 'Roches cristallines', color: '#E36DAA' },
]
