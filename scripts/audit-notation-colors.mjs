#!/usr/bin/env node
/**
 * Audit of NOTATION codes that fall back to grey (#CCCCCC).
 *
 * Reproduces classifyNotation() (mirror of src/utils/geology-data.ts
 * PREFIX_RULES) in plain JS, then classifies every distinct NOTATION found in
 * the regional data. Unmatched codes are listed with a DESCR sample and a
 * feature count, to add the missing prefixes to the master table without
 * guessing.
 *
 * Line-by-line reading (files up to ~1 GB) — no full JSON load.
 *
 * Usage:
 *   node scripts/audit-notation-colors.mjs
 */

import { existsSync, createReadStream, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Reproduction of classifyNotation (mirror of geology-data.ts PREFIX_RULES) ──
// Same prefixes, same lengths — see src/utils/geology-data.ts for the source.

const PREFIX_RULES_RAW = [
  { prefixes: ['LMz-T', 'LMz'] },
  { prefixes: ['MzM'] }, { prefixes: ['MzS'] }, { prefixes: ['MzR'] }, { prefixes: ['Mz'] },
  { prefixes: ['TLB'] },
  { prefixes: ['Lã1', 'Lã5', 'Lã'] },
  { prefixes: ['Mp-u', 'Mp'] }, { prefixes: ['Mu'] }, { prefixes: ['Mv'] }, { prefixes: ['Mx'] }, { prefixes: ['M'] },
  { prefixes: ['Q'] },
  { prefixes: ['n4'] }, { prefixes: ['n2'] },
  { prefixes: ['a1'] },
  { prefixes: ['aã'] },
  { prefixes: ['e7'] }, { prefixes: ['e6'] }, { prefixes: ['e5'] }, { prefixes: ['e3', 'e4'] }, { prefixes: ['e1', 'e2'] },
  { prefixes: ['c6'] }, { prefixes: ['c5'] }, { prefixes: ['c4'] }, { prefixes: ['c3'] }, { prefixes: ['c2'] }, { prefixes: ['c1'] },
  { prefixes: ['n6'] }, { prefixes: ['n5'] },
  { prefixes: ['j7'] }, { prefixes: ['j6'] }, { prefixes: ['j5'] },
  { prefixes: ['j4'] }, { prefixes: ['j3'] },
  { prefixes: ['j2'] }, { prefixes: ['j1'] },
  { prefixes: ['l4'] }, { prefixes: ['l3'] }, { prefixes: ['l2'] }, { prefixes: ['l1'] },
  { prefixes: ['Hydro', 'GLB'] },
  { prefixes: ['SGH'] },
  { prefixes: ['SL', 'VL'] },
  { prefixes: ['SC'] },
  { prefixes: ['CF'] },
  { prefixes: ['LP'] },
  { prefixes: ['OE'] },
  { prefixes: ['Tz'] },
  { prefixes: ['Fz', 'Fy', 'Fx', 'Fw', 'Fv', 'Fu'] },
  { prefixes: ['B-'] },
  { prefixes: ['e'] },
  { prefixes: ['c'] },
  { prefixes: ['j', 'l'] },
  { prefixes: ['p'] },
  { prefixes: ['m'] },
  { prefixes: ['g'] },
  { prefixes: ['t'] },
  { prefixes: ['r'] },
  { prefixes: ['h'] },
  { prefixes: ['d'] },
  { prefixes: ['s'] },
  { prefixes: ['o'] },
  { prefixes: ['k'] },
  { prefixes: ['b'] },
  { prefixes: ['Èæ', 'ã', 'î', 'ó', 'Ã', 'Õ', 'ñ', 'Å', 'Û', '¥', 'Ê', 'ï', 'â'] },
  { prefixes: ['q', 'F', 'C', 'D', 'E', 'K', 'S', 'U', 'X', 'R'] },
  { prefixes: ['°', '³'] },
  { prefixes: ['¡'] },
]

const SORTED_RULES = PREFIX_RULES_RAW
  .flatMap(r => r.prefixes.map(prefix => prefix))
  .sort((a, b) => b.length - a.length)

function classifyNotation(notation) {
  if (!notation) return null
  let normalized = notation
  const parenMatch = notation.match(/^\(([^)]+)\)/)
  if (parenMatch) normalized = parenMatch[1]
  const rangePart = normalized.split('-')[0]
  const candidates = rangePart !== normalized ? [rangePart, normalized] : [normalized]

  for (const candidate of candidates) {
    for (const prefix of SORTED_RULES) {
      if (candidate.startsWith(prefix)) return prefix
    }
  }
  return null // grey fallback
}

// ── Read the regional GeoJSON files line by line ──────────────────────────────

const DATA_WORK_MAIN = '/srv/http/geo-france/data-work'
const dataWorkDir = existsSync(DATA_WORK_MAIN) ? DATA_WORK_MAIN : null
if (!dataWorkDir) {
  console.error('ERROR: data-work directory not found.')
  process.exit(1)
}

const NOTATION_RE = /"NOTATION":\s*"([^"]*)"/
const DESCR_RE = /"DESCR":\s*"([^"]*)"/

async function scanGeojson(filePath, unmatched) {
  return new Promise((resolve, reject) => {
    const rl = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }), crlfDelay: Infinity })
    let count = 0
    rl.on('line', line => {
      const nm = NOTATION_RE.exec(line)
      if (!nm) return
      const notation = nm[1]
      count++
      if (classifyNotation(notation) !== null) return
      const dm = DESCR_RE.exec(line)
      const descr = dm ? dm[1].slice(0, 120) : ''
      const entry = unmatched.get(notation) ?? { count: 0, descr }
      entry.count++
      unmatched.set(notation, entry)
    })
    rl.on('close', () => resolve(count))
    rl.on('error', reject)
  })
}

const regions = readdirSync(dataWorkDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort()

const unmatched = new Map() // notation → { count, descr }
let totalFeatures = 0

for (const region of regions) {
  const geojsonPath = join(dataWorkDir, region, 'S_FGEOL_merged.geojson')
  if (!existsSync(geojsonPath)) continue
  process.stdout.write(`  ${region} ... `)
  const n = await scanGeojson(geojsonPath, unmatched)
  totalFeatures += n
  console.log(`${n} features`)
}

const totalUnmatched = [...unmatched.values()].reduce((s, e) => s + e.count, 0)
console.log(`\nTotal features       : ${totalFeatures}`)
console.log(`Distinct grey codes  : ${unmatched.size}`)
console.log(`Grey features        : ${totalUnmatched} (${(100 * totalUnmatched / totalFeatures).toFixed(1)}%)`)

const sorted = [...unmatched.entries()].sort((a, b) => b[1].count - a[1].count)
console.log('\n── Unclassified codes, sorted by frequency ──────────────────────')
for (const [notation, { count, descr }] of sorted) {
  console.log(`  ${String(count).padStart(6)}  ${JSON.stringify(notation).padEnd(18)}  ${descr}`)
}

const outPath = join(ROOT, 'public/images/rocks/notation-color-gaps.json')
writeFileSync(outPath, JSON.stringify(sorted.map(([notation, v]) => ({ notation, ...v })), null, 2) + '\n', 'utf8')
console.log(`\nWritten: ${outPath}`)
