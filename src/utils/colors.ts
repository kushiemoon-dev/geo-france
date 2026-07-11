// Build a MapLibre expression that maps NOTATION prefixes to ICS colors
// Uses case expressions with string prefix matching (longest prefix first)
//
// Derived from geology-data.ts SORTED_RULES — the same table drives both the
// map fill color and the detail-panel age classification, so they can no
// longer drift apart (they used to be two independently hand-maintained lists).

import type { ExpressionSpecification } from 'maplibre-gl'
import { SORTED_RULES, classifyNotation } from './geology-data.ts'

function prefixCondition(prefix: string): ExpressionSpecification {
  const len = prefix.length
  return ['==', ['slice', ['get', 'NOTATION'], 0, len], prefix] as ExpressionSpecification
}

export function buildColorExpression(): ExpressionSpecification {
  // Build: ['case', cond1, color1, cond2, color2, ..., fallback]
  const parts: unknown[] = ['case']

  for (const { prefix, entry } of SORTED_RULES) {
    parts.push(prefixCondition(prefix), entry.color)
  }

  // classifyNotation() strips a leading "(...)" before matching (e.g. "(b2-r)LM"
  // → "b2-r"), but this render-time expression only slices the raw NOTATION —
  // it can't reproduce that normalization. Add an explicit "(b" case so
  // parenthesized Briovérien notations still render pink instead of grey.
  parts.push(prefixCondition('(b'), classifyNotation('b').color)

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
