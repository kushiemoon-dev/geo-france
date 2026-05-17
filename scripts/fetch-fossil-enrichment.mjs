#!/usr/bin/env node
/**
 * Extrait les fossiles des notices BRGM (pdftotext) et écrit fossils-enriched.json.
 * Paleobiodb ignoré (API instable - 504 systématique).
 *
 * Usage:
 *   node scripts/fetch-fossil-enrichment.mjs [--force]
 *
 * Prérequis: poppler-utils (pdftotext), connexion internet.
 * Cache PDF dans /tmp/notice-pdfs/ — idempotent.
 */

import { createWriteStream, mkdirSync, existsSync, readFileSync } from 'fs'
import { writeFile, unlink } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const execFileAsync = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const force = process.argv.includes('--force')

// ── Fossil keywords (subset de FOSSIL_GROUPS) ────────────────────────────────
const FOSSIL_GROUPS = {
  ammonites: ['ammonites', 'ammonite', 'ammonitique', 'goniatites', 'hildoceras', 'harpoceras',
    'lytoceras', 'arnioceras', 'baculites', 'scaphites', 'orthocères', 'orthoceres',
    'cardioceras', 'nautiles', 'céphalopodes', 'cephalopodes'],
  bélemnites: ['bélemnites', 'bélemnite', 'belemnites', 'belemnite'],
  échinodermes: ['échinodermes', 'echinodermes', 'oursins', 'oursin', 'crinoïdes', 'crinoides', 'encrines'],
  échinides: ['échinides', 'echinides', 'échinide', 'echinide'],
  brachiopodes: ['brachiopodes', 'brachiopode', 'térébratules', 'terebratules', 'térébratule',
    'terebratule', 'rhynchonelles', 'rhynchonelle', 'rhynchonella', 'orthis', 'spirifer', 'athyris'],
  bivalves: ['bivalves', 'bivalve', 'lamellibranches', 'pélécypodes', 'pelecypodes',
    'huîtres', 'huître', 'huitres', 'huitre', 'gryphées', 'gryphees', 'gryphée', 'gryphee',
    'gryphaea', 'exogyra', 'exogyres', 'ostrea', 'pecten', 'pectinidés', 'pectinides',
    'plicatules', 'trigonies', 'trigonia', 'inocérames', 'inocerames', 'inoceramus'],
  gastéropodes: ['gastéropodes', 'gasteropodes', 'gastropodes', 'cérithes', 'cerithes',
    'cérithe', 'cerithe', 'turritelles', 'turritella', 'natica', 'natices'],
  rudistes: ['rudistes', 'rudiste', 'hippurites', 'toucasia', 'caprines', 'radiolites'],
  coraux: ['coraux', 'corail', 'coralien', 'corallien', 'récifal', 'recifal', 'polypiers',
    'stromatopores', 'stromatoporidés', 'stromatoporides', 'rugosa', 'récif', 'recif'],
  foraminifères: ['foraminifères', 'foraminifere', 'foraminiferes', 'nummulites', 'nummulite',
    'nummulitique', 'orbitolines', 'orbitoline', 'milioles', 'miliole', 'miliolidés', 'miliolides',
    'alvéolines', 'alveolines', 'alvéoline', 'alveoline', 'lituolidés', 'lituolides',
    'orbitoïdes', 'orbitoides', 'orbitolinidés', 'orbitolinides', 'discocyclines', 'discocycline',
    'assilines', 'assiline', 'operculines', 'globigérines', 'globigerines', 'globotruncana',
    'rotalipora', 'calpionelles', 'praeglobotruncana', 'globotruncane'],
  trilobites: ['trilobites', 'trilobite', 'paradoxides'],
  vertébrés: ['poissons', 'poisson', 'reptiles', 'reptile', 'dinosaures', 'dinosaure',
    'mammifères', 'mammifere', 'mammiferes', 'vertébrés', 'vertebre', 'vertebres'],
  algues: ['algues', 'stromatolithes', 'characées', 'characees', 'dasycladacées', 'dasycladacees',
    'lithothamnium', 'microcodium'],
  bryozoaires: ['bryozoaires', 'bryozoaire'],
  microfossiles: ['radiolaires', 'ostracodes', 'conodontes', 'graptolites', 'chitinozoaires',
    'acritarches', 'dinoflagellés', 'dinoflagelles', 'spores', 'pollen', 'tentaculites',
    'microfaune', 'microflore'],
  annélides: ['annélides', 'annelides', 'serpules', 'terriers'],
  autres: ['éponges', 'eponges', 'spongiaires', 'fossiles', 'fossile', 'fossilifère',
    'fossilifere', 'bioclastes', 'bioclaste', 'empreintes',
    'encroûtements', 'encroutements', 'oncolites', 'oncolithes', 'oncoïdes', 'oncoides'],
}

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

// ── Fossil canonical forms (mirrors FOSSIL_CANONICAL in geology-data.ts) ─────
const FOSSIL_CANONICAL = {
  ammonites: 'ammonite', ammonite: 'ammonite', ammonitique: 'ammonite',
  goniatites: 'goniatite', goniatite: 'goniatite',
  hildoceras: 'hildoceras', harpoceras: 'harpoceras', lytoceras: 'lytoceras',
  arnioceras: 'arnioceras', baculites: 'baculite', scaphites: 'scaphite',
  'orthocères': 'orthocère', orthoceres: 'orthocère', cardioceras: 'cardioceras',
  nautiles: 'nautile', nautile: 'nautile',
  'céphalopodes': 'céphalopode', cephalopodes: 'céphalopode',
  'bélemnites': 'bélemnite', 'bélemnite': 'bélemnite', belemnites: 'bélemnite', belemnite: 'bélemnite',
  'échinodermes': 'échinoderme', echinodermes: 'échinoderme',
  oursins: 'oursin', oursin: 'oursin',
  'crinoïdes': 'crinoïde', crinoides: 'crinoïde', encrines: 'encrine',
  'échinides': 'échinide', echinides: 'échinide', 'échinide': 'échinide', echinide: 'échinide',
  brachiopodes: 'brachiopode', brachiopode: 'brachiopode',
  'térébratules': 'térébratule', terebratules: 'térébratule',
  'térébratule': 'térébratule', terebratule: 'térébratule',
  rhynchonelles: 'rhynchonelle', rhynchonelle: 'rhynchonelle', rhynchonella: 'rhynchonella',
  orthis: 'orthis', spirifer: 'spirifer', athyris: 'athyris',
  bivalves: 'bivalve', bivalve: 'bivalve',
  lamellibranches: 'lamellibranche', lamellibranche: 'lamellibranche',
  'pélécypodes': 'pélécypode', pelecypodes: 'pélécypode',
  'huîtres': 'huître', 'huître': 'huître', huitres: 'huître', huitre: 'huître',
  'gryphées': 'gryphée', gryphees: 'gryphée', 'gryphée': 'gryphée', gryphee: 'gryphée',
  gryphaea: 'gryphaea', exogyra: 'exogyra', exogyres: 'exogyre', ostrea: 'ostrea',
  pecten: 'pecten', 'pectinidés': 'pectinidé', pectinides: 'pectinidé', plicatules: 'plicatule',
  trigonies: 'trigonie', trigonia: 'trigonia',
  'inocérames': 'inocérame', inocerames: 'inocérame', inoceramus: 'inoceramus',
  'gastéropodes': 'gastéropode', gasteropodes: 'gastéropode', gastropodes: 'gastéropode',
  'cérithes': 'cérithe', cerithes: 'cérithe', 'cérithe': 'cérithe', cerithe: 'cérithe',
  turritelles: 'turritelle', turritella: 'turritella', natica: 'natica', natices: 'natice',
  rudistes: 'rudiste', rudiste: 'rudiste', hippurites: 'hippurite',
  toucasia: 'toucasia', caprines: 'caprine', radiolites: 'radiolite',
  coraux: 'corail', corail: 'corail', coralien: 'corail', corallien: 'corail',
  'récifal': 'récifal', recifal: 'récifal', polypiers: 'polypier',
  stromatopores: 'stromatopore',
  'stromatoporidés': 'stromatoporidé', stromatoporides: 'stromatoporidé',
  rugosa: 'rugosa', 'récif': 'récif', recif: 'récif',
  'foraminifères': 'foraminifère', foraminifere: 'foraminifère', foraminiferes: 'foraminifère',
  nummulites: 'nummulite', nummulite: 'nummulite', nummulitique: 'nummulite',
  orbitolines: 'orbitoline', orbitoline: 'orbitoline',
  milioles: 'miliole', miliole: 'miliole', 'miliolidés': 'miliolidé', miliolides: 'miliolidé',
  'alvéolines': 'alvéoline', alveolines: 'alvéoline', 'alvéoline': 'alvéoline', alveoline: 'alvéoline',
  'lituolidés': 'lituolidé', lituolides: 'lituolidé',
  'orbitoïdes': 'orbitoïde', orbitoides: 'orbitoïde',
  'orbitolinidés': 'orbitolinidé', orbitolinides: 'orbitolinidé',
  discocyclines: 'discocycline', discocycline: 'discocycline',
  assilines: 'assiline', assiline: 'assiline', operculines: 'operculine',
  'globigérines': 'globigérine', globigerines: 'globigérine',
  globotruncana: 'globotruncana', rotalipora: 'rotalipora', calpionelles: 'calpionelle',
  praeglobotruncana: 'praeglobotruncana', globotruncane: 'globotruncane',
  trilobites: 'trilobite', trilobite: 'trilobite', paradoxides: 'paradoxides',
  poissons: 'poisson', poisson: 'poisson', reptiles: 'reptile', reptile: 'reptile',
  dinosaures: 'dinosaure', dinosaure: 'dinosaure',
  'mammifères': 'mammifère', mammifere: 'mammifère', mammiferes: 'mammifère',
  'vertébrés': 'vertébré', vertebre: 'vertébré', vertebres: 'vertébré',
  algues: 'algue', stromatolithes: 'stromatolithe',
  'characées': 'characée', characees: 'characée',
  'dasycladacées': 'dasycladacée', dasycladacees: 'dasycladacée',
  lithothamnium: 'lithothamnium', microcodium: 'microcodium',
  bryozoaires: 'bryozoaire', bryozoaire: 'bryozoaire',
  radiolaires: 'radiolaire', ostracodes: 'ostracode', conodontes: 'conodonte',
  graptolites: 'graptolite', chitinozoaires: 'chitinozoaire', acritarches: 'acritarche',
  'dinoflagellés': 'dinoflagellé', dinoflagelles: 'dinoflagellé',
  spores: 'spore', pollen: 'pollen', tentaculites: 'tentaculite',
  'annélides': 'annélide', annelides: 'annélide', serpules: 'serpule', terriers: 'terrier',
  'éponges': 'éponge', eponges: 'éponge', spongiaires: 'spongiaire',
  fossiles: 'fossile', fossile: 'fossile', 'fossilifère': 'fossilifère', fossilifere: 'fossilifère',
  bioclastes: 'bioclaste', bioclaste: 'bioclaste', microfaune: 'microfaune',
  empreintes: 'empreinte',
  'encroûtements': 'encroûtement', encroutements: 'encroûtement',
  oncolites: 'oncolite', oncolithes: 'oncolite', 'oncoïdes': 'oncoïde', oncoides: 'oncoïde',
}

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

async function processNotice(sheet, url, attempt = 0) {
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

    return Object.keys(groups).length > 0 ? groups : null
  } catch (err) {
    if (attempt < 2) {
      await unlink(dest).catch(() => {})
      return processNotice(sheet, url, attempt + 1)
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

console.log(`Notices : ${sheets.length}`)

// Load existing result to merge incrementally
let byCarte = {}
const outPath = join(ROOT, 'src/config/fossils-enriched.json')
if (!force && existsSync(outPath)) {
  try {
    const existing = JSON.parse(readFileSync(outPath, 'utf8'))
    byCarte = existing.by_carte ?? {}
    console.log(`Cache : ${Object.keys(byCarte).length} cartes déjà traitées`)
  } catch { /* ignore */ }
}

const toProcess = force ? sheets : sheets.filter(s => !byCarte[s.sheet])
console.log(`À traiter : ${toProcess.length} notices\n`)

const CONCURRENCY = 4
let done = 0
let enriched = 0

async function worker(queue) {
  while (queue.length > 0) {
    const { sheet, url } = queue.shift()
    const groups = await processNotice(sheet, url)
    if (groups) {
      byCarte[sheet] = { groups, sources: [`notice:${sheet}`] }
      enriched++
    }
    done++
    process.stdout.write(
      `\r  ${done}/${toProcess.length} | enrichies: ${enriched} | actuel: ${sheet}    `
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

console.log(`\nÉcrit : ${outPath}`)
console.log(`  by_carte : ${Object.keys(byCarte).length} feuilles enrichies / ${sheets.length} totales`)
