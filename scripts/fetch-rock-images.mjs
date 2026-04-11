#!/usr/bin/env node
/**
 * Télécharge les images manquantes pour les lithologies sans photo dans ROCK_DB.
 * Utilise l'API REST Wikipedia (page/summary) qui retourne directement l'image principale.
 * Usage: node scripts/fetch-rock-images.mjs
 */

import { createWriteStream, existsSync, mkdirSync, appendFileSync, writeFileSync } from 'fs'
import { pipeline } from 'stream/promises'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const DEST = path.join(__dir, '..', 'public', 'images', 'rocks')
const ATTR_FILE = path.join(DEST, 'ATTRIBUTIONS.md')

// Termes de recherche sur Wikimedia Commons
const SEARCH_TERMS = {
  greze:      'Grèzes litées',
  alterite:   'Laterite weathered rock',
}

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
  if (res.statusCode === 429) {
    const retryAfter = parseInt(res.headers['retry-after'] || '10', 10)
    res.resume()
    throw Object.assign(new Error(`HTTP 429`), { retryAfter })
  }
  if (res.statusCode !== 200) {
    res.resume()
    throw new Error(`HTTP ${res.statusCode}`)
  }
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

async function getCommonsImageUrl(searchTerm) {
  // 1. Chercher un fichier sur Wikimedia Commons
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=20&format=json`
  const searchData = await fetchJson(searchUrl)
  const results = searchData?.query?.search
  if (!results || results.length === 0) return null

  // 2. Prendre le premier résultat jpg/png (ignorer svg, gif, tif)
  for (const r of results) {
    const t = r.title.toLowerCase()
    if (!t.endsWith('.jpg') && !t.endsWith('.jpeg') && !t.endsWith('.png') && !t.endsWith('.webp')) continue

    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json`
    const infoData = await fetchJson(infoUrl)
    const pages = infoData?.query?.pages
    if (!pages) continue
    const page = Object.values(pages)[0]
    const info = page?.imageinfo?.[0]
    if (!info) continue
    const mime = info.mime || ''
    if (!mime.startsWith('image/jpeg') && !mime.startsWith('image/png')) continue
    const url = info.thumburl || info.url
    if (!url) continue
    return { url, title: r.title }
  }
  return null
}

mkdirSync(DEST, { recursive: true })
if (!existsSync(ATTR_FILE)) {
  writeFileSync(ATTR_FILE, '# Attributions images lithologies\n\nSource: Wikipedia / Wikimedia Commons (CC-BY-SA)\n\n')
}

let ok = 0, skipped = 0, failed = 0
const failures = []

for (const [name, searchTerm] of Object.entries(SEARCH_TERMS)) {
  const dest = path.join(DEST, `${name}.jpg`)
  if (existsSync(dest)) {
    console.log(`  skip  ${name}.jpg`)
    skipped++
    continue
  }

  process.stdout.write(`  ...   ${name} `)
  try {
    const result = await getCommonsImageUrl(searchTerm)
    if (!result) throw new Error('aucun résultat Commons')

    await downloadImage(result.url, dest)
    console.log(`→ ok`)
    appendFileSync(ATTR_FILE, `- **${name}.jpg** : "${result.title}" — ${result.url}\n`)
    ok++
    await new Promise(r => setTimeout(r, 4000))
  } catch (err) {
    console.log(`→ FAIL (${err.message})`)
    failed++
    failures.push(name)
  }
}

console.log(`\nTerminé: ${ok} téléchargés, ${skipped} ignorés, ${failed} échoués`)
if (failures.length > 0) {
  console.log(`Échoués:\n  ${failures.join('\n  ')}`)
  console.log('\n→ Déposer manuellement dans public/images/rocks/<nom>.jpg')
}
