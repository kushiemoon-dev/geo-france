#!/usr/bin/env node
/**
 * Measures the network cost of loading a page in a disposable, cache-empty
 * Chromium profile, driven over raw CDP (Chrome DevTools Protocol) so no
 * playwright/puppeteer dependency is needed.
 *
 * Reports: number of requests, total MB transferred, MB transferred for
 * PMTiles sources specifically, and time to network-idle after the page's
 * load event fires.
 *
 * Usage:
 *   node scripts/measure-national-load.mjs <url>
 */

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROMIUM_START_TIMEOUT_MS = 5000
const NETWORK_QUIET_TIMEOUT_MS = 30000
// 1000ms (plan's illustrative value) fires too early on this app: maplibre-gl's
// WASM/WebGL init runs ~2.3s with zero network activity between the initial
// asset fetches and the first basemap/PMTiles requests (measured empirically
// with --disable-gpu headless Chromium). 3000ms bridges that gap safely while
// staying well under the 30s no-progress timeout.
const QUIET_WINDOW_MS = 3000
const QUIET_POLL_INTERVAL_MS = 100
const PMTILES_URL_PATTERN = /\/data\/[^/]+\.pmtiles(\?|$)/

// blob:/data: requests resolve locally and never get a matching
// Network.loadingFinished/Failed event — tracking them leaves inFlight stuck
// above 0 forever, so network-idle is never reached.
function isNetworkUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://')
}

// maplibre-gl v6 loads its worker as a same-origin http(s) module script
// instead of the blob: URL older versions used. Its completion fires on the
// worker's own CDP target, not the page's, an attach-then-instant-detach
// race made Target.setAutoAttach too unreliable to catch it, so the fetch
// this filters out never gets a page-session Network.loadingFinished either
// and would otherwise stall network-idle detection forever, same failure
// mode as blob:.
const WORKER_SCRIPT_URL_PATTERN = /-worker\.mjs(\?|$)/

const targetUrl = process.argv[2]
if (!targetUrl) {
  console.error('Usage: node scripts/measure-national-load.mjs <url>')
  process.exit(1)
}

function spawnChromium(profileDir) {
  return spawn(
    '/usr/bin/chromium',
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )
}

function waitForDevtoolsPort(chromiumProcess) {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Chromium n'a pas ouvert de port DevTools (timeout ${CHROMIUM_START_TIMEOUT_MS}ms)`))
    }, CHROMIUM_START_TIMEOUT_MS)

    chromiumProcess.on('error', (err) => {
      clearTimeout(timeoutHandle)
      reject(new Error(`Impossible de démarrer Chromium : ${err.message}`))
    })

    let stderrBuffer = ''
    chromiumProcess.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString()
      const match = stderrBuffer.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)
      if (match) {
        clearTimeout(timeoutHandle)
        resolve(Number(match[1]))
      }
    })
  })
}

async function createTarget(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
  if (!response.ok) {
    throw new Error(`Le endpoint DevTools a répondu ${response.status} à la création de l'onglet`)
  }
  return response.json()
}

function connectWebSocket(webSocketDebuggerUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketDebuggerUrl)
    socket.addEventListener('open', () => resolve(socket))
    socket.addEventListener('error', () => reject(new Error('Connexion WebSocket au DevTools échouée')))
  })
}

// CDP replies carry an `id` correlated to the sent command; events (no `id`)
// are routed to their registered listeners instead.
function createCdpClient(ws) {
  let nextId = 1
  const pending = new Map()
  const eventListeners = new Map()

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(`CDP ${msg.error.code} : ${msg.error.message}`))
      else resolve(msg.result)
    } else if (msg.method) {
      for (const listener of eventListeners.get(msg.method) ?? []) {
        listener(msg.params)
      }
    }
  })

  // A closed connection (Chromium crash, kill) otherwise leaves any in-flight
  // send() promise pending forever, since it will never get a matching reply.
  ws.addEventListener('close', () => {
    for (const { reject } of pending.values()) {
      reject(new Error('Connexion WebSocket au DevTools fermée avant la réponse'))
    }
    pending.clear()
  })

  function send(method, params = {}) {
    const id = nextId++
    ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
  }

  function onEvent(method, listener) {
    const listeners = eventListeners.get(method) ?? new Set()
    listeners.add(listener)
    eventListeners.set(method, listeners)
  }

  return { send, onEvent }
}

async function measure(url, profileDir, chromiumProcessRef) {
  const chromiumProcess = spawnChromium(profileDir)
  chromiumProcessRef.value = chromiumProcess
  const port = await waitForDevtoolsPort(chromiumProcess)

  const { webSocketDebuggerUrl } = await createTarget(port)
  const ws = await connectWebSocket(webSocketDebuggerUrl)
  chromiumProcessRef.ws = ws

  const { send, onEvent } = createCdpClient(ws)

  const inFlight = new Set()
  const urlsByRequestId = new Map()
  let requestCount = 0
  let totalBytes = 0
  let pmtilesBytes = 0

  onEvent('Network.requestWillBeSent', (params) => {
    if (!isNetworkUrl(params.request.url)) return
    if (WORKER_SCRIPT_URL_PATTERN.test(params.request.url)) return
    inFlight.add(params.requestId)
    urlsByRequestId.set(params.requestId, params.request.url)
  })

  onEvent('Network.loadingFinished', (params) => {
    requestCount++
    totalBytes += params.encodedDataLength
    const requestUrl = urlsByRequestId.get(params.requestId)
    if (requestUrl && PMTILES_URL_PATTERN.test(requestUrl)) {
      pmtilesBytes += params.encodedDataLength
    }
    inFlight.delete(params.requestId)
  })

  onEvent('Network.loadingFailed', (params) => {
    inFlight.delete(params.requestId)
  })

  await send('Network.enable')
  await send('Page.enable')

  let loadFired = false
  let quietSince = null
  onEvent('Page.loadEventFired', () => {
    loadFired = true
  })
  onEvent('Network.requestWillBeSent', (params) => {
    if (isNetworkUrl(params.request.url) && !WORKER_SCRIPT_URL_PATTERN.test(params.request.url)) {
      quietSince = null
    }
  })

  const navigationStartTime = Date.now()

  const quietAtMs = await new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      clearInterval(interval)
      reject(new Error(`Le réseau ne devient jamais calme (timeout ${NETWORK_QUIET_TIMEOUT_MS}ms)`))
    }, NETWORK_QUIET_TIMEOUT_MS)

    const interval = setInterval(() => {
      if (!loadFired || inFlight.size > 0) {
        quietSince = null
        return
      }
      if (quietSince === null) {
        quietSince = Date.now()
        return
      }
      if (Date.now() - quietSince >= QUIET_WINDOW_MS) {
        clearInterval(interval)
        clearTimeout(timeoutHandle)
        resolve(Date.now() - navigationStartTime)
      }
    }, QUIET_POLL_INTERVAL_MS)

    send('Page.navigate', { url }).then((result) => {
      if (result.errorText) {
        clearInterval(interval)
        clearTimeout(timeoutHandle)
        reject(new Error(`Navigation échouée : ${result.errorText}`))
      }
    }, reject)
  })

  return { requestCount, totalBytes, pmtilesBytes, quietAtMs }
}

const profileDir = mkdtempSync(join(tmpdir(), 'geo-france-measure-'))
const chromiumProcessRef = {}

try {
  const result = await measure(targetUrl, profileDir, chromiumProcessRef)
  console.log(`Requêtes : ${result.requestCount}`)
  console.log(`Total transféré : ${(result.totalBytes / 1_000_000).toFixed(2)} Mo`)
  console.log(`PMTiles transférées : ${(result.pmtilesBytes / 1_000_000).toFixed(2)} Mo`)
  console.log(`Temps jusqu'à réseau calme : ${(result.quietAtMs / 1000).toFixed(2)} s`)
  process.exitCode = 0
} catch (err) {
  console.error(`Erreur : ${err.message}`)
  process.exitCode = 1
} finally {
  chromiumProcessRef.ws?.close()
  chromiumProcessRef.value?.kill('SIGTERM')
  await new Promise((resolve) => {
    if (!chromiumProcessRef.value || chromiumProcessRef.value.exitCode !== null) return resolve()
    chromiumProcessRef.value.once('exit', resolve)
  })
  rmSync(profileDir, { recursive: true, force: true })
}
