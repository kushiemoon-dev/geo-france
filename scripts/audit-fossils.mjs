#!/usr/bin/env node
/**
 * Audit and cleanup of Precambrian / magmatic fossils.
 *
 * Rules:
 *   R1: all formations on a sheet are Precambrian → clear groups
 *   R2: all formations on a sheet are magmatic (Roches cristallines) → clear groups
 *   Mix: leave in place, log to pending-review.json
 *
 * GeoJSON reading strategy: line by line (files up to 1.1 GB)
 * Extracts CARTE + NOTATION via regex without loading the JSON into memory.
 *
 * Usage:
 *   node scripts/audit-fossils.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, createReadStream } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

// ── Reproduction of classifyNotation's logic in JS ──────────────────────
// (mirror of geology-data.ts — only ere and periode are needed)

const PREFIX_RULES_RAW = [
  // Composite notations (longest first)
  { prefixes: ['LMz-T', 'LMz'], ere: 'Mesozoique', periode: 'Jurassique' },
  { prefixes: ['MzM', 'MzS', 'MzR', 'Mz'], ere: 'Mesozoique', periode: '' },
  { prefixes: ['TLB'], ere: 'Mesozoique', periode: 'Trias-Lias' },
  { prefixes: ['Lã1', 'Lã5', 'Lã'], ere: 'Mesozoique', periode: 'Jurassique' },
  { prefixes: ['Mp-u', 'Mp', 'Mu', 'Mv', 'Mx'], ere: 'Cenozoique', periode: 'Neogene' },
  { prefixes: ['Q'], ere: 'Cenozoique', periode: 'Quaternaire' },
  { prefixes: ['n4', 'n2'], ere: 'Mesozoique', periode: 'Cretace' },
  { prefixes: ['a1'], ere: '', periode: 'Alterites' },
  { prefixes: ['aã'], ere: '', periode: 'Roches cristallines' },
  { prefixes: ['e7', 'e6', 'e5', 'e4', 'e3', 'e2', 'e1', 'e'], ere: 'Cenozoique', periode: 'Paleogene' },
  { prefixes: ['c7', 'c6', 'c5', 'c4', 'c3', 'c2', 'c1'], ere: 'Mesozoique', periode: 'Cretace' },
  { prefixes: ['n7', 'n6', 'n5', 'n3', 'n1'], ere: 'Mesozoique', periode: 'Cretace' },
  { prefixes: ['j9', 'j8', 'j7', 'j6', 'j5', 'j4', 'j3', 'j2', 'j1', 'j'], ere: 'Mesozoique', periode: 'Jurassique' },
  { prefixes: ['c', 'n'], ere: 'Mesozoique', periode: 'Cretace' },
  { prefixes: ['t'], ere: 'Mesozoique', periode: 'Trias' },
  { prefixes: ['r'], ere: 'Paleozoique', periode: 'Permien' },
  { prefixes: ['h'], ere: 'Paleozoique', periode: 'Carbonifere' },
  { prefixes: ['d'], ere: 'Paleozoique', periode: 'Devonien' },
  { prefixes: ['s'], ere: 'Paleozoique', periode: 'Silurien' },
  { prefixes: ['o'], ere: 'Paleozoique', periode: 'Ordovicien' },
  { prefixes: ['k'], ere: 'Paleozoique', periode: 'Cambrien' },
  // Precambrien (b prefix — Brioverien)
  { prefixes: ['b'], ere: 'Precambrien', periode: 'Brioverien' },
  // Roches cristallines (magmatic/metamorphic basement rocks)
  // Bare accents (ä ë û å ì ò í ü Á Ù) synced with src/utils/geology-data.ts
  // following the scripts/audit-notation-colors.mjs audit — without them,
  // crystalline granodiorites/schists slipped past rule R2 (no mapping = no cleanup).
  { prefixes: ['Èæ', 'ã', 'î', 'ó', 'Ã', 'Õ', 'ñ', 'Å', 'Û', '¥', 'Ê', 'ï', 'â', 'ä', 'ë', 'û', 'å', 'ì', 'ò', 'í', 'ü', 'Á', 'Ù'], ere: '', periode: 'Roches cristallines' },
  // Quaternaire catch-all
  { prefixes: ['q', 'F', 'C', 'D', 'E', 'K', 'S', 'U', 'X', 'R'], ere: 'Cenozoique', periode: 'Quaternaire' },
  { prefixes: ['°', '³'], ere: 'Cenozoique', periode: 'Quaternaire' },
  // Neogene / Paleogene lowercase catch-all
  { prefixes: ['p'], ere: 'Cenozoique', periode: 'Neogene' },
  { prefixes: ['m'], ere: 'Cenozoique', periode: 'Neogene' },
  { prefixes: ['g'], ere: 'Cenozoique', periode: 'Paleogene' },
  // Alterites catch-all
  { prefixes: ['¡'], ere: '', periode: 'Alterites' },
  // Uppercase Miocene
  { prefixes: ['M'], ere: 'Cenozoique', periode: 'Neogene' },
]

// Sort: longest prefix first (mirrors SORTED_RULES in geology-data.ts)
const SORTED_RULES = PREFIX_RULES_RAW
  .flatMap(r => r.prefixes.map(prefix => ({ prefix, ere: r.ere, periode: r.periode })))
  .sort((a, b) => b.prefix.length - a.prefix.length)

function classifyNotation(notation) {
  if (!notation) return { ere: '', periode: 'Indetermine' }

  let normalized = notation
  const parenMatch = notation.match(/^\(([^)]+)\)/)
  if (parenMatch) normalized = parenMatch[1]
  const rangePart = normalized.split('-')[0]
  const candidates = rangePart !== normalized ? [rangePart, normalized] : [normalized]

  for (const candidate of candidates) {
    for (const rule of SORTED_RULES) {
      if (candidate.startsWith(rule.prefix)) {
        return { ere: rule.ere, periode: rule.periode }
      }
    }
  }
  return { ere: '', periode: 'Indetermine' }
}

function isPrecambrien(cls) {
  return cls.ere === 'Precambrien'
}

function isCrystalline(cls) {
  // Roches cristallines = granites, gabbros, gneiss, etc. (basement rock, both magmatic
  // AND metamorphic — heat/pressure destroys all organic matter either way, cf. detail-panel.ts)
  return cls.periode === 'Roches cristallines'
}

// Sheets known geologically to be entirely magmatic but not covered by the
// GeoJSON mapping (GeoJSON CARTE values ≠ BRGM notice numbers)
// Corsica: dominant Hercynian granite (notices 1103–1120)
const KNOWN_MAGMATIC_NOTICES = new Set(['1103', '1110', '1117', '1118', '1119', '1120'])

// ── Load fossils-enriched.json ─────────────────────────────────────────
const FOSSILS_PATH = join(ROOT, 'src/config/fossils-enriched.json')
const fossilsRaw = JSON.parse(readFileSync(FOSSILS_PATH, 'utf8'))
const byCarte = fossilsRaw.by_carte

// ── Read the GeoJSON files line by line to extract CARTE + NOTATION ─────────
// Each feature is on a single line in these files.
// Pattern: "CARTE": 2479, ... "NOTATION": "ph"

const DATA_WORK_MAIN = '/srv/http/geo-france/data-work'
const DATA_WORK_REL = join(ROOT, '..', '..', '..', '..', 'data-work')
const dataWorkDir = existsSync(DATA_WORK_MAIN) ? DATA_WORK_MAIN :
  existsSync(DATA_WORK_REL) ? DATA_WORK_REL : null

if (!dataWorkDir) {
  console.error('ERROR: data-work directory not found.')
  process.exit(1)
}

console.log(`data-work: ${dataWorkDir}`)

const CARTE_RE = /"CARTE":\s*(\d+)/
const NOTATION_RE = /"NOTATION":\s*"([^"]+)"/

async function extractFromGeojson(filePath, carteNotations) {
  return new Promise((resolve, reject) => {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    })
    let count = 0
    rl.on('line', line => {
      const cm = CARTE_RE.exec(line)
      const nm = NOTATION_RE.exec(line)
      if (cm && nm) {
        const c = parseInt(cm[1], 10)
        const n = nm[1]
        const noticeNum = c >= 2000 ? c - 2000 : c
        const key = String(noticeNum).padStart(4, '0')
        if (!carteNotations.has(key)) carteNotations.set(key, new Set())
        carteNotations.get(key).add(n)
        count++
      }
    })
    rl.on('close', () => resolve(count))
    rl.on('error', reject)
  })
}

// Collect NOTATION sets from all regions
const carteNotations = new Map() // carteKey → Set<NOTATION>
const regions = readdirSync(dataWorkDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort()

let totalFeatures = 0
for (const region of regions) {
  const geojsonPath = join(dataWorkDir, region, 'S_FGEOL_merged.geojson')
  if (!existsSync(geojsonPath)) continue
  process.stdout.write(`  ${region} ... `)
  const n = await extractFromGeojson(geojsonPath, carteNotations)
  totalFeatures += n
  console.log(`${n} features`)
}

console.log(`\nTotal features: ${totalFeatures}`)
console.log(`Sheets with NOTATION: ${carteNotations.size}`)

// ── Apply rules R1 / R2 ──────────────────────────────────────────
let clearedR1 = 0
let clearedR2 = 0
let clearedMix = 0
let pendingMix = 0
let noMapping = 0

const pendingReview = []
const updatedByCarte = {}

for (const [carteKey, entry] of Object.entries(byCarte)) {
  const hasGroups = Object.keys(entry.groups).length > 0
  if (!hasGroups) {
    updatedByCarte[carteKey] = entry
    continue
  }

  if (KNOWN_MAGMATIC_NOTICES.has(carteKey)) {
    clearedR2++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    console.log(`  R2 Override    : sheet ${carteKey} — known granitic geology (Corsica)`)
    continue
  }

  const notations = carteNotations.get(carteKey)
  if (!notations || notations.size === 0) {
    noMapping++
    pendingReview.push({
      carte: carteKey,
      reason: 'no_geojson_mapping',
      notations: [],
      groupsCount: Object.keys(entry.groups).length,
    })
    updatedByCarte[carteKey] = entry
    continue
  }

  const classified = [...notations].map(n => ({ notation: n, cls: classifyNotation(n) }))

  const allPrecambrien = classified.every(({ cls }) => isPrecambrien(cls))
  const allMagmatic = classified.every(({ cls }) => isCrystalline(cls))
  // Mix where every notation is EITHER precambrien OR magmatic (no fossiliferous formations)
  const allPrecambrienOrMagmatic = classified.every(({ cls }) => isPrecambrien(cls) || isCrystalline(cls))

  const fossilNotations = classified.filter(({ cls }) => !isPrecambrien(cls) && !isCrystalline(cls))

  if (allPrecambrien) {
    clearedR1++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    const sample = [...notations].slice(0, 3).join(',')
    console.log(`  R1 Precambrian : sheet ${carteKey} — cleared (${notations.size} notations, e.g.: ${sample})`)
  } else if (allMagmatic) {
    clearedR2++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    const sample = [...notations].slice(0, 3).join(',')
    console.log(`  R2 Magmatic    : sheet ${carteKey} — cleared (${notations.size} notations, e.g.: ${sample})`)
  } else if (allPrecambrienOrMagmatic) {
    clearedMix++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    const sample = [...notations].slice(0, 3).join(',')
    console.log(`  R1+R2 mix      : sheet ${carteKey} — cleared (Precambrian+magmatic only, ${sample})`)
  } else {
    // Mix with fossiliferous formations: leave in place, log if it also contains Precambrian/magmatic
    const precambrienNotations = classified.filter(({ cls }) => isPrecambrien(cls)).map(({ notation }) => notation)
    const magmaticNotations = classified.filter(({ cls }) => isCrystalline(cls)).map(({ notation }) => notation)
    if (precambrienNotations.length > 0 || magmaticNotations.length > 0) {
      pendingMix++
      pendingReview.push({
        carte: carteKey,
        reason: 'mixed_formations',
        totalNotations: notations.size,
        fossilNotations: fossilNotations.map(({ notation }) => notation).slice(0, 10),
        precambrienNotations: precambrienNotations.slice(0, 10),
        magmaticNotations: magmaticNotations.slice(0, 10),
        groupsCount: Object.keys(entry.groups).length,
      })
    }
    updatedByCarte[carteKey] = entry
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n── Result ──────────────────────────────────────────────────')
console.log(`  Sheets processed          : ${Object.keys(byCarte).length}`)
console.log(`  Cleared R1 (Precambrian)  : ${clearedR1}`)
console.log(`  Cleared R2 (Magmatic)     : ${clearedR2}`)
console.log(`  Cleared R1+R2 (pure mix)  : ${clearedMix}`)
console.log(`  Fossiliferous mixes       : ${pendingMix} → pending-review.json`)
console.log(`  No GeoJSON mapping        : ${noMapping} → pending-review.json`)
console.log(`  Total cleared             : ${clearedR1 + clearedR2 + clearedMix}`)

// ── Write the result ─────────────────────────────────────────────────────
if (!DRY_RUN) {
  const updated = {
    generated: new Date().toISOString(),
    by_carte: updatedByCarte,
  }
  writeFileSync(FOSSILS_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8')
  console.log(`\nWritten: ${FOSSILS_PATH}`)

  const pendingPath = join(ROOT, 'public/images/rocks/pending-review.json')
  writeFileSync(pendingPath, JSON.stringify(pendingReview, null, 2) + '\n', 'utf8')
  console.log(`Written: ${pendingPath} (${pendingReview.length} entries)`)
} else {
  console.log('\n[DRY-RUN] No file written.')
}
