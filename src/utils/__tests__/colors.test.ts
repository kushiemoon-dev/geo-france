import { describe, it, expect } from 'vitest'
import { buildColorExpression } from '../colors.ts'

// Helper: simulate the MapLibre case expression against a NOTATION string
function evalColorExpression(notation: string): string {
  const expr = buildColorExpression()
  // expr is ['case', cond1, color1, ..., fallback]
  // Evaluate each condition manually
  const parts = expr as unknown[]
  for (let i = 1; i < parts.length - 1; i += 2) {
    const cond = parts[i] as unknown[]
    const color = parts[i + 1] as string
    if (evalCondition(cond, notation)) return color
  }
  return parts[parts.length - 1] as string
}

function evalCondition(cond: unknown[], notation: string): boolean {
  if (cond[0] === '==') {
    const sliceExpr = cond[1] as unknown[]
    const expected = cond[2] as string
    // ['slice', ['get', 'NOTATION'], 0, len]
    const len = sliceExpr[3] as number
    return notation.slice(0, len) === expected
  }
  if (cond[0] === 'any') {
    return (cond.slice(1) as unknown[][]).some(c => evalCondition(c, notation))
  }
  return false
}

describe('buildColorExpression — Briovérien (b*)', () => {
  const BRIO_PINK = '#F4B8D4'

  it('notation simple b → rose', () => {
    expect(evalColorExpression('b')).toBe(BRIO_PINK)
  })

  it('b1, b2S, b3G, b4S, b5Sg, b6A → rose', () => {
    for (const n of ['b1', 'b2S', 'b3G', 'b4S', 'b5Sg', 'b6A']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('bC, bP, bS, bG → rose', () => {
    for (const n of ['bC', 'bP', 'bS', 'bG']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('bSG, bSL, bSN, bSV, bSM, bSMK → rose', () => {
    for (const n of ['bSG', 'bSL', 'bSN', 'bSV', 'bSM', 'bSMK']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('bk, bkS, bkSG, bkæ, bkA, bkP → rose', () => {
    for (const n of ['bk', 'bkS', 'bkSG', 'bkæ', 'bkA', 'bkP']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('bñ, bÃ, bâL, bäL, bíL, bóP → rose (accentuated suffixes)', () => {
    for (const n of ['bñ', 'bÃ', 'bâL', 'bäL', 'bíL', 'bóP']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('b(1), b(cal), b(Ûå) → rose (parenthesized suffix)', () => {
    for (const n of ['b(1)', 'b(cal)', 'b(Ûå)']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('b-o1S, b-o2, b-o2S1 → rose (hyphen suffix)', () => {
    for (const n of ['b-o1S', 'b-o2', 'b-o2S1']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('b2-3s, bS1-2, bS1-2(s) → rose (range suffix)', () => {
    for (const n of ['b2-3s', 'bS1-2', 'bS1-2(s)']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('bæ1-2, bñ1-2, bard, bcal, bû → rose', () => {
    for (const n of ['bæ1-2', 'bñ1-2', 'bard', 'bcal', 'bû']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })

  it('Normandie variants b1S, b1G, b2G, bS2, bKO2 → rose', () => {
    for (const n of ['b1S', 'b1G', 'b2G', 'bS2', 'bKO2']) {
      expect(evalColorExpression(n)).toBe(BRIO_PINK)
    }
  })
})

describe('buildColorExpression — nouvelles règles (précédemment gris)', () => {
  it('Lã, Lã1-2K, Lã3P → Lias (#34B2E8)', () => {
    for (const n of ['Lã', 'Lã1-2K', 'Lã3P']) {
      expect(evalColorExpression(n)).toBe('#34B2E8')
    }
  })

  it('LMz, LMz-T → Lias (#34B2E8)', () => {
    for (const n of ['LMz', 'LMz-T']) {
      expect(evalColorExpression(n)).toBe('#34B2E8')
    }
  })

  it('Mz, MzG, MzV, MzS → Mesozoique (#67C5B0)', () => {
    for (const n of ['Mz', 'MzG', 'MzV', 'MzS']) {
      expect(evalColorExpression(n)).toBe('#67C5B0')
    }
  })

  it('M, M1-2, MG → Miocene (#FFFF00)', () => {
    for (const n of ['M', 'M1-2', 'MG']) {
      expect(evalColorExpression(n)).toBe('#FFFF00')
    }
  })

  it('My, Mv, Mx, Mp → Miocene subdivisions (#FFFF00)', () => {
    for (const n of ['My', 'Mv', 'Mx', 'Mp']) {
      expect(evalColorExpression(n)).toBe('#FFFF00')
    }
  })

  it('Q, QS, Qbr → Quaternaire (#F9F97F)', () => {
    for (const n of ['Q', 'QS', 'Qbr']) {
      expect(evalColorExpression(n)).toBe('#F9F97F')
    }
  })

  it('ï, ï1, ï2 → Cristallin (#E36DAA)', () => {
    for (const n of ['ï', 'ï1', 'ï2']) {
      expect(evalColorExpression(n)).toBe('#E36DAA')
    }
  })

  it('aã, aã1t → Cristallin altéré (#E36DAA)', () => {
    for (const n of ['aã', 'aã1t']) {
      expect(evalColorExpression(n)).toBe('#E36DAA')
    }
  })

  it('n2, n4 → Crétacé inférieur (#7ECD74)', () => {
    for (const n of ['n2', 'n4']) {
      expect(evalColorExpression(n)).toBe('#7ECD74')
    }
  })
})

describe('buildColorExpression — non-régression', () => {
  it('j3 → Jurassique moyen (#80CFFF)', () => {
    expect(evalColorExpression('j3')).toBe('#80CFFF')
  })

  it('j7 → Jurassique supérieur (#B3D4FF)', () => {
    expect(evalColorExpression('j7')).toBe('#B3D4FF')
  })

  it('c2 → Crétacé supérieur (#A6D468)', () => {
    expect(evalColorExpression('c2')).toBe('#A6D468')
  })

  it('e5 → Eocène (#FDB46C)', () => {
    expect(evalColorExpression('e5')).toBe('#FDB46C')
  })

  it('n5 → Crétacé inférieur (#7ECD74)', () => {
    expect(evalColorExpression('n5')).toBe('#7ECD74')
  })

  it('ã4 → Cristallin (#E36DAA)', () => {
    expect(evalColorExpression('ã4')).toBe('#E36DAA')
  })

  it('SGH → Quaternaire (#F9F97F)', () => {
    expect(evalColorExpression('SGH')).toBe('#F9F97F')
  })

  it('Fz → Quaternaire (#F9F97F)', () => {
    expect(evalColorExpression('Fz')).toBe('#F9F97F')
  })

  it('B-LPS → Quaternaire (#F9F97F, B- prefix)', () => {
    expect(evalColorExpression('B-LPS')).toBe('#F9F97F')
  })

  it('inconnu → fallback gris (#CCCCCC)', () => {
    expect(evalColorExpression('zzz999')).toBe('#CCCCCC')
  })
})
