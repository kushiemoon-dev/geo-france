#!/usr/bin/env node
/**
 * Extracts fossils from BRGM notices (pdftotext) and writes fossils-enriched.json.
 * Paleobiodb skipped (unstable API - systematic 504).
 *
 * Usage:
 *   node scripts/fetch-fossil-enrichment.mjs [--force] [--limit=N]
 *   node scripts/fetch-fossil-enrichment.mjs --backfill-by-notation
 *     Reprocess sheets already cached but missing per-formation attribution
 *     (B2), limited to sheets with a known NOTATION vocabulary (data-work).
 *
 * Requires: poppler-utils (pdftotext), internet connection.
 * PDF cache in /tmp/notice-pdfs/ — idempotent.
 */

import { createWriteStream, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs'
import { writeFile, unlink } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'
import { createReadStream } from 'fs'
import http from 'http'

const execFileAsync = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const force = process.argv.includes('--force')
const limitArg = process.argv.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

// ── Fossil keywords — imported from shared vocabulary ─────────────────────────
import { FOSSIL_GROUPS, FOSSIL_CANONICAL as _FOSSIL_CANONICAL } from '../src/utils/fossil-vocabulary.mjs'

const MAX_TERMS = 12
// French common words to skip in genus extraction
const SKIP_WORDS = new Set([
  'Les', 'La', 'Le', 'Des', 'De', 'En', 'Au', 'Aux', 'Par', 'Sur', 'Sous', 'Dans',
  'Une', 'Un', 'Cette', 'Ces', 'Ce', 'Avec', 'Sans', 'Pour', 'Vers', 'Note', 'Figure',
  'Planche', 'Tableau', 'Voir', 'Cf', 'Fig', 'Pl', 'Tab', 'Niveau', 'Zone', 'Faune',
  'Flore', 'Formation', 'Calcaire', 'Marne', 'Craie', 'Sable', 'Argile', 'Base',
  'Sommet', 'Partie', 'Couche', 'Couches', 'Banc', 'Bancs', 'Lit', 'Lits',
  'France', 'Paris', 'Normandie', 'Bretagne', 'Est', 'Ouest', 'Nord', 'Sud',
  'Aucun', 'Seul', 'Seule', 'Aussi', 'Ainsi', 'Mais', 'Cependant', 'Notamment',
  'Association', 'Crinoïdes', 'Bivalves', 'Brachiopodes', 'Ammonites', 'Foraminifères',
])

const FOSSIL_CANONICAL = _FOSSIL_CANONICAL

// ── Text extraction helpers ───────────────────────────────────────────────────
function extractFossilsFromText(text) {
  const lower = text.normalize('NFC').toLowerCase()
  const out = {}
  for (const [group, terms] of Object.entries(FOSSIL_GROUPS)) {
    const found = []
    for (const term of terms) {
      if (lower.includes(term) && !found.includes(term)) found.push(term)
    }
    if (found.length > 0) {
      const mapped = found.map(t => FOSSIL_CANONICAL[t] ?? t)
      const deduped = [...new Set(mapped)]
      out[group] = deduped.slice(0, MAX_TERMS)
    }
  }
  return out
}

// Extract potential genus names (Capitalized single token, length 5-25)
function extractGenera(text) {
  const genera = new Set()
  // Match Capitalized words that look like Latin genera (not at sentence start)
  // Pattern: whitespace/comma then Capital word
  const re = /(?:[\s,;(]|^)([A-Z][a-z]{4,24})(?=[\s,;.()[\]]|$)/gm
  let m
  while ((m = re.exec(text)) !== null) {
    const word = m[1]
    if (!SKIP_WORDS.has(word)) genera.add(word)
  }
  return [...genera]
}

// Extract paleontology sections from full PDF text
function extractFossilSections(fullText) {
  // Section header patterns used in BRGM notices
  const headerRe = /(?:^|\n[ \t]*)(?:[IVX]+\s*[-–—.]\s*|[A-Z]\s*[-–—.]\s*|\d+\s*[-–—.]\s*)?(?:Pal[eé]ontologie|Contenu\s+pal[eé]ontologique|Mat[eé]riel\s+fossile|Esp[eè]ces?\s+fossiles?|Description\s+pal[eé]ontologique|(?:La\s+)?[Ff]aune|(?:La\s+)?[Ff]lore|[Ff]ossiles?)\s*[:\n]/gm
  const sections = []
  let m
  while ((m = headerRe.exec(fullText)) !== null) {
    const start = m.index
    // Capture up to 3000 chars or next major section header
    const chunk = fullText.slice(start, start + 3000)
    sections.push(chunk)
  }
  return sections.join('\n')
}

// ── Per-formation attribution (B2) ──────────────────────────────────────────────
// BRGM notices structure their text as paragraphs starting with the NOTATION
// code of the formation they describe (e.g. "c4. Coniacien. Craie à silex...").
// A naive regex over any short-token-plus-period pattern is noisy (PDF line-wrap
// artifacts, sentence-final words) — validated against the real NOTATION
// vocabulary of the sheet (from the region GeoJSON) instead of guessing.

const DATA_WORK_DIR = join(ROOT, 'data-work')
const CARTE_RE = /"CARTE":\s*(\d+)/
const NOTATION_RE = /"NOTATION":\s*"([^"]+)"/

function carteToNoticeKey(carte) {
  const n = parseInt(carte, 10)
  const noticeNum = n >= 2000 ? n - 2000 : n
  return String(noticeNum).padStart(4, '0')
}

async function buildCarteNotationMap() {
  const map = new Map() // sheetKey → Set<NOTATION>
  if (!existsSync(DATA_WORK_DIR)) return map
  const regions = readdirSync(DATA_WORK_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name).sort()
  for (const region of regions) {
    const geojsonPath = join(DATA_WORK_DIR, region, 'S_FGEOL_merged.geojson')
    if (!existsSync(geojsonPath)) continue
    await new Promise((resolve, reject) => {
      const rl = createInterface({ input: createReadStream(geojsonPath, { encoding: 'utf8' }), crlfDelay: Infinity })
      rl.on('line', line => {
        const cm = CARTE_RE.exec(line)
        const nm = NOTATION_RE.exec(line)
        if (!cm || !nm) return
        const key = carteToNoticeKey(cm[1])
        if (!map.has(key)) map.set(key, new Set())
        map.get(key).add(nm[1])
      })
      rl.on('close', resolve)
      rl.on('error', reject)
    })
  }
  return map
}

// Extract fossils per-formation: scan for paragraphs starting with a real
// NOTATION code of this sheet, scope dictionary matching to that paragraph's
// text span only (up to the next matched code, or 3000 chars).
function extractFossilsByFormation(fullText, realNotations) {
  if (!realNotations || realNotations.size === 0) return {}
  // Codes < 2 chars excluded: single letters collide too often with BRGM
  // notices' own "a./b./c." sub-facies enumeration within a formation's
  // paragraph (validated on real notices — e.g. 'b' matched a bullet list
  // item, not the Briovérien map notation, and inherited an unrelated
  // fossil list).
  const sorted = [...realNotations].filter(n => n.length >= 2).sort((a, b) => b.length - a.length)
  const escaped = sorted.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const codePattern = new RegExp(`(?:^|\\n)[ \\t]*(${escaped.join('|')})\\.[ \\t]`, 'gm')

  const matches = []
  let m
  while ((m = codePattern.exec(fullText)) !== null) {
    matches.push({ code: m[1], paraStart: m.index + m[0].length })
  }

  const byFormation = {}
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].paraStart
    const end = i + 1 < matches.length ? matches[i + 1].paraStart : Math.min(start + 3000, fullText.length)
    const fossils = extractFossilsFromText(fullText.slice(start, end))
    if (Object.keys(fossils).length === 0) continue
    const code = matches[i].code
    const existing = byFormation[code] ?? {}
    for (const [group, terms] of Object.entries(fossils)) {
      existing[group] = [...new Set([...(existing[group] ?? []), ...terms])].slice(0, MAX_TERMS)
    }
    byFormation[code] = existing
  }
  return byFormation
}

// ── Download ──────────────────────────────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    http.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.destroy()
        // All BRGM URLs are http, redirects stay http
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.destroy()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', reject)
    }).on('error', (e) => { file.destroy(); reject(e) })
  })
}

// ── Process one notice ────────────────────────────────────────────────────────
const TMP_DIR = '/tmp/notice-pdfs'
mkdirSync(TMP_DIR, { recursive: true })

async function processNotice(sheet, url, realNotations, attempt = 0) {
  const dest = join(TMP_DIR, `${sheet}.pdf`)
  try {
    if (!existsSync(dest) || force) {
      await downloadFile(url, dest)
    }
    const { stdout } = await execFileAsync('pdftotext', ['-layout', '-q', dest, '-'],
      { maxBuffer: 20 * 1024 * 1024 })

    // Dict matching on full text (robust: BRGM notices vary in structure)
    const groups = extractFossilsFromText(stdout)

    // Genus extraction limited to paleontology sections only (reduces noise)
    const sectionText = extractFossilSections(stdout)
    const targetText = sectionText || stdout  // fallback to full text if no sections
    const genera = extractGenera(targetText)
    if (genera.length > 0) {
      const existing = new Set(Object.values(groups).flat())
      const newGenera = genera.filter(g => !existing.has(g)).slice(0, 10)
      if (newGenera.length > 0) {
        groups['genres'] = newGenera
      }
    }

    // Per-formation attribution (B2) — sheet-level `groups` stays as fallback
    // for formations whose paragraph the pattern didn't catch.
    const byNotation = extractFossilsByFormation(stdout, realNotations)

    if (Object.keys(groups).length === 0) return null
    return { groups, byNotation }
  } catch (err) {
    if (attempt < 2) {
      await unlink(dest).catch(() => {})
      return processNotice(sheet, url, realNotations, attempt + 1)
    }
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const noticesSrc = readFileSync(join(ROOT, 'src/config/notices.ts'), 'utf8')
const sheetRe = /sheet:\s*'(\d{4})'[^}]*url:\s*'([^']+)'/g
const sheets = []
let sm
while ((sm = sheetRe.exec(noticesSrc)) !== null) {
  sheets.push({ sheet: sm[1], url: sm[2] })
}

console.log(`Notices: ${sheets.length}`)

// Load existing result to merge incrementally
let byCarte = {}
const outPath = join(ROOT, 'src/config/fossils-enriched.json')
if (!force && existsSync(outPath)) {
  try {
    const existing = JSON.parse(readFileSync(outPath, 'utf8'))
    byCarte = existing.by_carte ?? {}
    console.log(`Cache: ${Object.keys(byCarte).length} sheets already processed`)
  } catch { /* ignore */ }
}

console.log('Building real NOTATION vocabulary per sheet (data-work)...')
const carteNotationMap = await buildCarteNotationMap()
console.log(`  ${carteNotationMap.size} sheets with known NOTATION vocabulary`)

// Reprocess if forced, never seen, or missing the per-formation attribution
// (B2) — but only sheets with a known NOTATION vocabulary (data-work), since
// re-processing the rest would just reproduce the same sheet-level `groups`
// already cached (no data-work coverage → by_notation stays empty either way).
const backfillTarget = process.argv.includes('--backfill-by-notation')
let toProcess = force
  ? sheets
  : sheets.filter(s => {
      if (!byCarte[s.sheet]) return true
      if (backfillTarget) return !byCarte[s.sheet].by_notation && carteNotationMap.has(s.sheet)
      return false
    })
if (limit) toProcess = toProcess.slice(0, limit)
console.log(`To process: ${toProcess.length} notices${limit ? ` (--limit=${limit})` : ''}\n`)

const CONCURRENCY = 4
let done = 0
let enriched = 0

let byFormationCount = 0

async function worker(queue) {
  while (queue.length > 0) {
    const { sheet, url } = queue.shift()
    const realNotations = carteNotationMap.get(sheet)
    const result = await processNotice(sheet, url, realNotations)
    if (result) {
      byCarte[sheet] = { groups: result.groups, by_notation: result.byNotation, sources: [`notice:${sheet}`] }
      enriched++
      if (Object.keys(result.byNotation).length > 0) byFormationCount++
    }
    done++
    process.stdout.write(
      `\r  ${done}/${toProcess.length} | enriched: ${enriched} | per-formation: ${byFormationCount} | current: ${sheet}    `
    )
  }
}

const queue = [...toProcess]
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)))
console.log()

// Sort keys for stable diffs
const sortObj = obj => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))

const result = {
  generated: new Date().toISOString(),
  by_carte: sortObj(byCarte),
}

await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8')

console.log(`\nWritten: ${outPath}`)
console.log(`  by_carte: ${Object.keys(byCarte).length} sheets enriched / ${sheets.length} total`)
