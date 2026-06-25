#!/usr/bin/env node
/**
 * Audit et nettoyage des fossiles précambriens / magmatiques.
 *
 * Règles :
 *   R1 : toutes les formations d'une carte sont précambriennes → vider groups
 *   R2 : toutes les formations d'une carte sont magmatiques (Roches cristallines) → vider groups
 *   Mix : laisser en place, loguer dans pending-review.json
 *
 * Stratégie lecture GeoJSON : ligne par ligne (fichiers jusqu'à 1.1 Go)
 * Extrait CARTE + NOTATION par regex sans charger le JSON en mémoire.
 *
 * Usage :
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

// ── Reproduction de la logique classifyNotation en JS ──────────────────────
// (miroir de geology-data.ts — seuls ere et periode sont nécessaires)

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
  // Roches cristallines (magmatiques/métamorphiques du socle)
  { prefixes: ['Èæ', 'ã', 'î', 'ó', 'Ã', 'Õ', 'ñ', 'Å', 'Û', '¥', 'Ê', 'ï', 'â'], ere: '', periode: 'Roches cristallines' },
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

function isMagmatic(cls) {
  // Roches cristallines = granites, gabbros, gneiss, etc. (socle magmatique/métamorphique)
  return cls.periode === 'Roches cristallines'
}

// Cartes géologiquement connues comme intégralement magmatiques mais non couvertes
// par le mapping GeoJSON (CARTE values GeoJSON ≠ numéros de notices BRGM)
// Corse : granite hercynien dominant (notices 1103–1120)
const KNOWN_MAGMATIC_NOTICES = new Set(['1103', '1110', '1117', '1118', '1119', '1120'])

// ── Charger fossils-enriched.json ─────────────────────────────────────────
const FOSSILS_PATH = join(ROOT, 'src/config/fossils-enriched.json')
const fossilsRaw = JSON.parse(readFileSync(FOSSILS_PATH, 'utf8'))
const byCarte = fossilsRaw.by_carte

// ── Lire les GeoJSON ligne par ligne pour extraire CARTE + NOTATION ─────────
// Chaque feature est sur une seule ligne dans ces fichiers.
// Pattern : "CARTE": 2479, ... "NOTATION": "ph"

const DATA_WORK_MAIN = '/srv/http/geo-france/data-work'
const DATA_WORK_REL = join(ROOT, '..', '..', '..', '..', 'data-work')
const dataWorkDir = existsSync(DATA_WORK_MAIN) ? DATA_WORK_MAIN :
  existsSync(DATA_WORK_REL) ? DATA_WORK_REL : null

if (!dataWorkDir) {
  console.error('ERREUR : répertoire data-work introuvable.')
  process.exit(1)
}

console.log(`data-work : ${dataWorkDir}`)

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

// Collect NOTATION → Set from all regions
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

console.log(`\nTotal features : ${totalFeatures}`)
console.log(`Cartes avec NOTATION : ${carteNotations.size}`)

// ── Appliquer les règles R1 / R2 ──────────────────────────────────────────
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
    console.log(`  R2 Override    : carte ${carteKey} — géologie granitique connue (Corse)`)
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
  const allMagmatic = classified.every(({ cls }) => isMagmatic(cls))
  // Mix where every notation is EITHER precambrien OR magmatic (no fossiliferous formations)
  const allPrecambrienOrMagmatic = classified.every(({ cls }) => isPrecambrien(cls) || isMagmatic(cls))

  const fossilNotations = classified.filter(({ cls }) => !isPrecambrien(cls) && !isMagmatic(cls))

  if (allPrecambrien) {
    clearedR1++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    const sample = [...notations].slice(0, 3).join(',')
    console.log(`  R1 Précambrien : carte ${carteKey} — vidé (${notations.size} not., ex: ${sample})`)
  } else if (allMagmatic) {
    clearedR2++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    const sample = [...notations].slice(0, 3).join(',')
    console.log(`  R2 Magmatique  : carte ${carteKey} — vidé (${notations.size} not., ex: ${sample})`)
  } else if (allPrecambrienOrMagmatic) {
    clearedMix++
    updatedByCarte[carteKey] = { ...entry, groups: {} }
    const sample = [...notations].slice(0, 3).join(',')
    console.log(`  R1+R2 mix      : carte ${carteKey} — vidé (uniquement précambrien+magmatique, ${sample})`)
  } else {
    // Mix avec des formations fossilifères : laisser en place, loguer si contient aussi précambrien/magmatique
    const precambrienNotations = classified.filter(({ cls }) => isPrecambrien(cls)).map(({ notation }) => notation)
    const magmaticNotations = classified.filter(({ cls }) => isMagmatic(cls)).map(({ notation }) => notation)
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

// ── Résumé ─────────────────────────────────────────────────────────────────
console.log('\n── Résultat ──────────────────────────────────────────────────')
console.log(`  Cartes traitées           : ${Object.keys(byCarte).length}`)
console.log(`  Vidées R1 (Précambrien)   : ${clearedR1}`)
console.log(`  Vidées R2 (Magmatique)    : ${clearedR2}`)
console.log(`  Vidées R1+R2 (mix pur)    : ${clearedMix}`)
console.log(`  Mixtes fossilifères        : ${pendingMix} → pending-review.json`)
console.log(`  Sans mapping GeoJSON       : ${noMapping} → pending-review.json`)
console.log(`  Total vidées               : ${clearedR1 + clearedR2 + clearedMix}`)

// ── Écrire le résultat ─────────────────────────────────────────────────────
if (!DRY_RUN) {
  const updated = {
    generated: new Date().toISOString(),
    by_carte: updatedByCarte,
  }
  writeFileSync(FOSSILS_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8')
  console.log(`\nÉcrit : ${FOSSILS_PATH}`)

  const pendingPath = join(ROOT, 'public/images/rocks/pending-review.json')
  writeFileSync(pendingPath, JSON.stringify(pendingReview, null, 2) + '\n', 'utf8')
  console.log(`Écrit : ${pendingPath} (${pendingReview.length} entrées)`)
} else {
  console.log('\n[DRY-RUN] Aucun fichier écrit.')
}
