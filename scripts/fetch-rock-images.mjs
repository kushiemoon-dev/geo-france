#!/usr/bin/env node
/**
 * Télécharge/remplace les images de roches via Wikimedia Commons avec scoring.
 * Usage: node scripts/fetch-rock-images.mjs [options]
 *   --status=quarantined|missing|all  (défaut: quarantined)
 *   --rock=<key>   cible unique
 *   --force        re-télécharger même si fichier existe
 *   --dry-run      log uniquement, pas de download
 *
 * Sortie: public/images/rocks/<key>.jpg + public/images/rocks/metadata.json
 * Prérequis: connexion internet
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { pipeline } from 'stream/promises'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dir, '..')
const DEST = path.join(ROOT, 'public', 'images', 'rocks')
const META_FILE = path.join(DEST, 'metadata.json')
const ATTR_FILE = path.join(DEST, 'ATTRIBUTIONS.md')
const MINERAL_SRC = path.join(ROOT, 'src/utils/mineral-data.ts')

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const statusFlag = args.find(a => a.startsWith('--status='))?.split('=')[1] ?? 'quarantined'
const rockFlag   = args.find(a => a.startsWith('--rock='))?.split('=')[1]
const force      = args.includes('--force')
const dryRun     = args.includes('--dry-run')

// ── Queries qualifiées FR→EN ──────────────────────────────────────────────────
const QUERY_MAP = {
  argile:       'claystone mudstone argillaceous rock outcrop geological hand specimen',
  sable:        'quartz sand grains geological sample',
  gaize:        'greensand siliceous rock glauconitic',
  spilite:      'pillow lava basalt greenstone rock outcrop',
  ampelite:     'carbonaceous shale black schist alum specimen',
  alterite:     'laterite saprolite weathered rock',
  colluvion:    'debris flow slope deposit erosion sediment',
  tangue:       'tidal flat mud calcareous sediment',
  phtanite:     'chert lydite rock specimen',
  pelite:       'argillite mudrock sedimentary rock sample',
  trondhjemite: 'leucocratic plutonic rock hand specimen',
  dolomie:      'dolostone dolomite carbonate rock hand specimen outcrop geology',
  craie:        'chalk white cretaceous limestone rock outcrop cliff geology specimen',
  gres:         'sandstone hand specimen rock geology sample',
  grauwacke:    'greywacke wacke turbidite rock hand specimen geology',
  schiste:      'phyllite schist metamorphic rock hand specimen outcrop',
  loess:        'loess aeolian deposit windblown silt sediment outcrop geological',
  limon:        'silt alluvial deposit floodplain sediment',
  alluvion:     'alluvial gravel sediment fluvial deposit riverbed',
  tourbe:       'peat bog peatland sediment geological formation',
  meuliere:     'meulière siliceous rock millstone geology specimen',
  marne:        'marl grey limestone clay sedimentary outcrop cliff geological hand specimen',
  falun:        'coquina bioclastic shell sand deposit Loire sedimentary rock geology',
  greze:        'grèze litée periglacial stratified scree sediment geology',
}
const DEFAULT_SUFFIX = 'rock hand specimen geology'

const BLACKLIST   = /\b(map|sketch|pdf|diagram|landscape|sculpture|pottery|ceramic|plate|painting|chart|schema|drawing|stamp|coin|flag|bone|skull|museum|display|cabinet|journal|quarterly|proceedings|review|bulletin|notice|annual|grindstone|tableware|artifact|artefact|carving|brick|tile|statue|figurine|arch|arche|children|child|kids|people|person|boy|girl|playing|portrait|village|town|city|house|building|monument|tower|blackboard|classroom|school|crayon|colored|colour|color|writing|pastel|agamidae|lizard|reptile|amphibian|insect|butterfly|bird|mammal|plant|flower|tree|forest|fungi|mushroom|bacteria|soldier|infantry|military|division|emblem|regiment|army|gold|silver|copper|zinc|ore|mine|mining|miner)\b|fossils?/i
const TITLE_BONUS = /\b(specimen|outcrop|hand.?sample|hand.?specimen|thin.?section|rock|stone|geological|geology|sample|exposure|fragment|block|core|sand|clay|shale|chert|basalt|granite|limestone|schist|gneiss|quartzite|sandstone|mudstone|mudrock|siltstone|sediment|mineral|petrograph|litholog)\b/i

// ── Parse ROCK_DB depuis mineral-data.ts ──────────────────────────────────────
function parseRockKeys() {
  const src = readFileSync(MINERAL_SRC, 'utf8')
  const allKeys       = [...src.matchAll(/^\s{2}(\w+):\s*\{[^}\n]*type:/gm)].map(m => m[1])
  const quarantined   = new Set([...src.matchAll(/^\s{2}(\w+):\s*\{[^}\n]*imageStatus:\s*'quarantined'/gm)].map(m => m[1]))
  const withImage     = new Set([...src.matchAll(/^\s{2}(\w+):\s*\{[^}\n]*image:\s*'/gm)].map(m => m[1]))
  const missing       = new Set(allKeys.filter(k => !withImage.has(k)))
  return { allKeys, quarantined, missing }
}

function getTargets(statusFlag, quarantined, missing, allKeys) {
  if (statusFlag === 'quarantined') return [...quarantined]
  if (statusFlag === 'missing')     return [...missing]
  return allKeys
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'brgmremaster-bot/1.0 (educational geological map)' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGet(res.headers.location).then(resolve).catch(reject)
        return
      }
      resolve(res)
    })
    req.on('error', reject)
    req.setTimeout(20000, () => { req.destroy(new Error('timeout')) })
  })
}

async function fetchJson(url) {
  const res = await httpsGet(url)
  if (res.statusCode !== 200) { res.resume(); throw new Error(`HTTP ${res.statusCode}`) }
  return new Promise((resolve, reject) => {
    let body = ''
    res.on('data', d => body += d)
    res.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
    res.on('error', reject)
  })
}

async function downloadImage(url, destPath) {
  const res = await httpsGet(url)
  if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`)
  await pipeline(res, createWriteStream(destPath))
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreResult(title, info) {
  const t = title.toLowerCase()
  if (BLACKLIST.test(t)) return -99
  let score = 0
  if (TITLE_BONUS.test(t)) score += 2
  const { width = 0, height = 0, size = 0 } = info
  if (width >= 800 && height >= 600) score += 1
  if (size >= 100_000 && size <= 5_000_000) score += 1
  const ratio = width > 0 && height > 0 ? width / height : 0
  if (ratio >= 1.2 && ratio <= 1.9) score += 1
  return score
}

// ── Commons search + scoring ──────────────────────────────────────────────────
async function searchCommons(query, limit = 15) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${limit}&format=json`
  const data = await fetchJson(url)
  return (data?.query?.search ?? []).filter(r => /\.(jpg|jpeg)$/i.test(r.title))
}

async function getImageInfo(titles) {
  if (titles.length === 0) return {}
  const param = titles.map(t => encodeURIComponent(t)).join('|')
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${param}` +
    `&prop=imageinfo&iiprop=url|mime|size|extmetadata` +
    `&iiextmetadatafilter=Artist|LicenseShortName|DescriptionUrl&iiurlwidth=800&format=json`
  const data = await fetchJson(url)
  return data?.query?.pages ?? {}
}

async function findBestImage(key) {
  const primaryQuery = QUERY_MAP[key] ?? `${key.replace(/_/g, ' ')} ${DEFAULT_SUFFIX}`
  const fallbackQuery = `${key.replace(/_/g, ' ')} rock`

  let candidates = await searchCommons(primaryQuery)
  // fallback si pas assez de candidats JPG
  if (candidates.length < 3) {
    const extra = await searchCommons(fallbackQuery)
    const seen = new Set(candidates.map(r => r.title))
    candidates = [...candidates, ...extra.filter(r => !seen.has(r.title))]
  }
  candidates = candidates.slice(0, 8)
  if (candidates.length === 0) return null

  const pages = await getImageInfo(candidates.map(r => r.title))

  let best = null
  let bestScore = -1 // accepte tout non-blacklisté

  // Itérer sur les pages retournées (évite le bug de normalisation de titre)
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined) continue
    const info = page.imageinfo?.[0]
    if (!info) continue
    const mime = info.mime ?? ''
    if (!mime.startsWith('image/jpeg') && !mime.startsWith('image/png')) continue

    const score = scoreResult(page.title, info)
    if (score > bestScore) {
      bestScore = score
      const meta = info.extmetadata ?? {}
      const rawAuthor = (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim()
      best = {
        url:        info.thumburl || info.url,
        title:      page.title,
        author:     rawAuthor || 'Wikimedia Commons',
        license:    meta.LicenseShortName?.value ?? 'CC-BY-SA',
        commonsUrl: meta.DescriptionUrl?.value ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        score,
      }
    }
  }

  if (!best || best.score < 2) return null
  return best
}

// ── Main ──────────────────────────────────────────────────────────────────────
mkdirSync(DEST, { recursive: true })

let metadata = {}
if (existsSync(META_FILE)) {
  try { metadata = JSON.parse(readFileSync(META_FILE, 'utf8')) } catch { /* ignore */ }
}

const { allKeys, quarantined, missing } = parseRockKeys()
let targets = rockFlag ? [rockFlag] : getTargets(statusFlag, quarantined, missing, allKeys)

// Sans --force : quarantainées = toujours retraiter, manquantes = skip si fichier existe
if (!force) {
  targets = targets.filter(k => {
    const dest = path.join(DEST, `${k}.jpg`)
    if (!existsSync(dest)) return true
    return quarantined.has(k)
  })
}

console.log(`Cible : ${targets.length} roches  [status=${statusFlag}${force ? ' force' : ''}${dryRun ? ' dry-run' : ''}]`)
if (targets.length === 0) { console.log('Rien à faire.'); process.exit(0) }
console.log()

let ok = 0, skipped = 0, failed = 0
const failures = []

for (const key of targets) {
  process.stdout.write(`  ${key.padEnd(16)} `)
  try {
    const result = await findBestImage(key)
    if (!result) {
      console.log(`FAIL  aucun résultat (score < 3)`)
      failures.push({ key, reason: 'score insuffisant' })
      failed++
      await new Promise(r => setTimeout(r, 1000))
      continue
    }

    if (dryRun) {
      console.log(`DRY   score=${result.score}  "${result.title.slice(0, 55)}"`)
      skipped++
    } else {
      const dest = path.join(DEST, `${key}.jpg`)
      await downloadImage(result.url, dest)
      metadata[key] = {
        title:   result.title,
        author:  result.author,
        license: result.license,
        url:     result.commonsUrl,
      }
      console.log(`OK    score=${result.score}  "${result.title.slice(0, 55)}"`)
      ok++
    }
    await new Promise(r => setTimeout(r, 4000))
  } catch (err) {
    console.log(`FAIL  ${err.message}`)
    failures.push({ key, reason: err.message })
    failed++
    await new Promise(r => setTimeout(r, 5000))
  }
}

// Écriture des sorties
if (!dryRun) {
  const sorted = Object.fromEntries(Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(META_FILE, JSON.stringify(sorted, null, 2), 'utf8')

  const lines = ['# Attributions images lithologies\n', 'Source : Wikimedia Commons\n']
  for (const [k, m] of Object.entries(sorted)) {
    lines.push(`- **${k}.jpg** : "${m.title}" — © ${m.author} (${m.license}) — ${m.url}`)
  }
  writeFileSync(ATTR_FILE, lines.join('\n') + '\n', 'utf8')
  console.log(`\n→ metadata.json mis à jour (${Object.keys(sorted).length} entrées)`)
}

console.log(`\nTerminé : ${ok} téléchargés, ${skipped} dry-run, ${failed} échecs`)
if (failures.length > 0) {
  console.log('\nÉchecs :')
  for (const f of failures) console.log(`  ${f.key.padEnd(16)} ${f.reason}`)
  console.log('\n→ Retry: node scripts/fetch-rock-images.mjs --rock=<clé> [--force]')
}
