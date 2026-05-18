#!/usr/bin/env node
// scripts/lighthouse-mobile.mjs
// Mesure de performance 4G mobile — baseline avant optimisations F1-F8
// Usage: node scripts/lighthouse-mobile.mjs

import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Résolution de playwright : d'abord local, sinon cache npx
const require = createRequire(import.meta.url)
function resolvePw() {
  const candidates = [
    join(ROOT, 'node_modules/playwright'),
    join(ROOT, 'node_modules/playwright-core'),
    '/home/kushie/.npm/_npx/86170c4cd1c5da32/node_modules/playwright',
    '/home/kushie/.npm/_npx/9833c18b2d85bc59/node_modules/playwright',
  ]
  for (const p of candidates) {
    try {
      return require(p)
    } catch {
      // continue
    }
  }
  throw new Error('Playwright introuvable. Installez-le : pnpm add -D playwright')
}

const { chromium } = resolvePw()

const URL = 'http://localhost:4173'
const VIEWPORT = { width: 375, height: 667 }
const NETWORK_4G = {
  downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps → bytes/s
  uploadThroughput: (750 * 1024) / 8,           // 750 kbps → bytes/s
  latency: 150,                                  // ms
}

async function waitForMapCanvas(page, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const hasPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      try {
        const ctx = canvas.getContext('2d')
        if (!ctx) return false
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        // Cherche un pixel non-transparent et non-blanc
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a > 0 && !(r === 255 && g === 255 && b === 255)) return true
        }
        return false
      } catch {
        return false
      }
    })
    if (hasPixels) return true
    await page.waitForTimeout(500)
  }
  return false
}

async function run() {
  const date = new Date().toISOString().slice(0, 10)
  const perfDir = join(ROOT, 'docs/perf')
  mkdirSync(perfDir, { recursive: true })

  console.log('Lancement Chromium headless…')
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Mobile Safari/537.36',
  })

  const page = await context.newPage()

  // Throttling réseau 4G via CDP
  const client = await context.newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: NETWORK_4G.downloadThroughput,
    uploadThroughput: NETWORK_4G.uploadThroughput,
    latency: NETWORK_4G.latency,
  })

  // Collecter les ressources réseau
  const resources = []
  page.on('response', (response) => {
    const headers = response.headers()
    const contentLength = parseInt(headers['content-length'] || '0', 10)
    resources.push({
      url: response.url(),
      status: response.status(),
      size: contentLength,
      type: headers['content-type'] || '',
    })
  })

  console.log(`Navigation vers ${URL}…`)
  const navStart = Date.now()
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  const domContentLoaded = Date.now() - navStart

  console.log('Attente chargement carte (max 30s)…')
  const canvasLoaded = await waitForMapCanvas(page, 30000)
  if (!canvasLoaded) {
    console.warn('⚠ Canvas non détecté dans le délai imparti — poursuite quand même')
  }

  // Attente fixe T+8s après navigation pour laisser la carte se rendre
  const elapsed = Date.now() - navStart
  const remaining = Math.max(0, 8000 - elapsed)
  if (remaining > 0) await page.waitForTimeout(remaining)

  // Métriques de timing
  const timing = await page.evaluate(() => {
    const t = window.performance.timing
    const nav = window.performance.getEntriesByType('navigation')[0]
    const paintEntries = window.performance.getEntriesByType('paint')
    const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint')
    const lcp = (() => {
      // LCP via PerformanceObserver entries (déjà collectées)
      const entries = window.performance.getEntriesByType('largest-contentful-paint')
      return entries.length > 0 ? entries[entries.length - 1].startTime : null
    })()

    const resources = window.performance.getEntriesByType('resource')
    const totalTransfer = resources.reduce((s, r) => s + (r.transferSize || 0), 0)
    const jsTransfer = resources
      .filter((r) => r.initiatorType === 'script' || r.name.endsWith('.js'))
      .reduce((s, r) => s + (r.transferSize || 0), 0)

    return {
      fcp_ms: fcp ? Math.round(fcp.startTime) : null,
      lcp_ms: lcp ? Math.round(lcp) : null,
      domContentLoaded_ms: nav
        ? Math.round(nav.domContentLoadedEventEnd)
        : t.domContentLoadedEventEnd - t.navigationStart || null,
      load_ms: nav
        ? Math.round(nav.loadEventEnd)
        : t.loadEventEnd - t.navigationStart || null,
      totalTransferSize_bytes: totalTransfer || null,
      jsTransferSize_bytes: jsTransfer || null,
      requestCount: resources.length,
    }
  })

  // Screenshot
  const screenshotPath = join(perfDir, `baseline-${date}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: false })
  console.log(`Screenshot sauvegardé : ${screenshotPath}`)

  await browser.close()

  // Enrichissement requestCount depuis les events réseau si manquant
  if (!timing.requestCount || timing.requestCount === 0) {
    timing.requestCount = resources.length
  }

  // Fallback domContentLoaded depuis mesure côté script
  if (!timing.domContentLoaded_ms || timing.domContentLoaded_ms === 0) {
    timing.domContentLoaded_ms = domContentLoaded
  }

  const result = {
    date,
    mode: '4G-mobile',
    metrics: timing,
    notes: 'baseline avant optimisations F1-F8',
  }

  const jsonPath = join(perfDir, `baseline-${date}.json`)
  writeFileSync(jsonPath, JSON.stringify(result, null, 2))
  console.log(`Résultats sauvegardés : ${jsonPath}`)
  console.log(JSON.stringify(result, null, 2))
}

run().catch((err) => {
  console.error('Erreur lors de la mesure :', err)
  process.exit(1)
})
