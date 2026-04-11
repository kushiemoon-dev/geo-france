#!/usr/bin/env node
/**
 * Télécharge chaque notice BRGM (0XXXN.pdf) et extrait le nombre de pages via pdfinfo.
 * Écrit le résultat dans src/config/notice-meta.json.
 * Exécution unique : node scripts/fetch-notice-meta.mjs
 */

import { createWriteStream, mkdirSync } from 'fs'
import { writeFile, unlink } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

const execFileAsync = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))

// Inline the sheet list from notices.ts at build time
// We read the source file and extract all sheet/url pairs with a regex
import { readFileSync } from 'fs'
const noticesSrc = readFileSync(join(__dirname, '../src/config/notices.ts'), 'utf8')
const sheetRe = /sheet:\s*'(\d{4})'[^}]*url:\s*'([^']+)'/g
const sheets = []
let m
while ((m = sheetRe.exec(noticesSrc)) !== null) {
  sheets.push({ sheet: m[1], url: m[2] })
}

console.log(`Notices trouvées : ${sheets.length}`)

const CONCURRENCY = 8
const RETRY = 2
const TMP_DIR = '/tmp/notice-pdfs'

mkdirSync(TMP_DIR, { recursive: true })

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const file = createWriteStream(dest)
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', reject)
    }).on('error', reject)
  })
}

async function getPages(sheet, url, attempt = 0) {
  const dest = join(TMP_DIR, `${sheet}.pdf`)
  try {
    await downloadFile(url, dest)
    const { stdout } = await execFileAsync('pdfinfo', [dest])
    const pagesMatch = stdout.match(/^Pages:\s*(\d+)/m)
    const sizeMatch = stdout.match(/^File size:\s*(\d+)/m)
    const pages = pagesMatch ? parseInt(pagesMatch[1], 10) : null
    const bytes = sizeMatch ? parseInt(sizeMatch[1], 10) : null
    await unlink(dest).catch(() => {})
    return { pages, bytes }
  } catch (err) {
    await unlink(dest).catch(() => {})
    if (attempt < RETRY) {
      return getPages(sheet, url, attempt + 1)
    }
    console.warn(`  ERR ${sheet}: ${err.message}`)
    return { pages: null, bytes: null }
  }
}

async function runBatch(items) {
  const results = {}
  let done = 0

  async function worker(queue) {
    while (queue.length > 0) {
      const { sheet, url } = queue.shift()
      const meta = await getPages(sheet, url)
      results[sheet] = meta
      done++
      if (done % 50 === 0 || done === sheets.length) {
        process.stdout.write(`\r  ${done}/${sheets.length}`)
      }
    }
  }

  const queue = [...items]
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue))
  await Promise.all(workers)
  console.log()
  return results
}

const meta = await runBatch(sheets)

const outPath = join(__dirname, '../src/config/notice-meta.json')
await writeFile(outPath, JSON.stringify(meta, null, 2), 'utf8')

const filled = Object.values(meta).filter(v => v.pages !== null).length
console.log(`\nécrit : ${outPath}`)
console.log(`notices avec pages connues : ${filled}/${sheets.length}`)
