#!/usr/bin/env node
/**
 * Serveur d'audit local pour valider visuellement les images de roches.
 * Usage: node scripts/audit-rock-images.mjs [--port=5174]
 *
 * Ouvrir http://localhost:5174 dans le navigateur.
 * Boutons OK → retire imageStatus:'quarantined' (patch pending-quarantine.json)
 * Boutons Reject → marque comme toujours invalide
 * Skip → passer sans action
 *
 * Sorties:
 *   public/images/rocks/metadata.json   — crédits mis à jour
 *   public/images/rocks/pending-quarantine.json — patch à appliquer dans mineral-data.ts
 */

import { createServer } from 'http'
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dir, '..')
const DEST = path.join(ROOT, 'public', 'images', 'rocks')
const MINERAL_SRC = path.join(ROOT, 'src/utils/mineral-data.ts')
const META_FILE = path.join(DEST, 'metadata.json')
const PENDING_FILE = path.join(DEST, 'pending-quarantine.json')

const port = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1] ?? '5174', 10)

// ── Parse ROCK_DB ──────────────────────────────────────────────────────────────
function parseRockDB() {
  const src = readFileSync(MINERAL_SRC, 'utf8')
  const entries = []
  const re = /^\s{2}(\w+):\s*\{([^[]+)/gm
  let m
  while ((m = re.exec(src)) !== null) {
    const key = m[1]
    const body = m[2]
    const get = (field) => body.match(new RegExp(`${field}:\\s*'([^']*)'`))?.[1] ?? ''
    const image = get('image')
    if (!image) continue
    entries.push({
      key,
      image,
      type: get('type'),
      origin: get('origin'),
      facies: get('facies'),
      texture: get('texture'),
      imageStatus: get('imageStatus') || 'verified',
    })
  }
  return entries
}

function loadJson(file) {
  if (!existsSync(file)) return {}
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return {} }
}

function saveJson(file, data) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(file, JSON.stringify(sorted, null, 2), 'utf8')
}

function getFileSizeKb(imgPath) {
  const full = path.join(ROOT, 'public', imgPath)
  if (!existsSync(full)) return null
  return Math.round(statSync(full).size / 1024)
}

// ── HTML generation ───────────────────────────────────────────────────────────
function buildHtml(rocks, metadata, pending, filter) {
  const filtered = filter === 'quarantined'
    ? rocks.filter(r => r.imageStatus === 'quarantined')
    : filter === 'unreviewed'
    ? rocks.filter(r => r.imageStatus === 'verified' && !metadata[r.key])
    : rocks

  const cards = filtered.map(r => {
    const sizeKb = getFileSizeKb(r.image)
    const sizeLabel = sizeKb ? `${sizeKb} Ko` : '⚠ manquant'
    const meta = metadata[r.key]
    const pend = pending[r.key]
    const statusBadge = r.imageStatus === 'quarantined'
      ? `<span class="badge q">quarantined</span>`
      : pend === 'ok'
      ? `<span class="badge ok">validé ✓</span>`
      : pend === 'reject'
      ? `<span class="badge rej">rejeté ✗</span>`
      : `<span class="badge v">verified</span>`

    const credit = meta
      ? `<div class="credit">© ${meta.author} — ${meta.license}<br><a href="${meta.url}" target="_blank" rel="noopener">${meta.title?.slice(0, 55) ?? ''}…</a></div>`
      : `<div class="credit dim">Pas de metadata (image originale)</div>`

    return `
    <div class="card ${r.imageStatus === 'quarantined' ? 'card-q' : ''}">
      <div class="img-wrap">
        <img src="/img/${r.key}.jpg" alt="${r.key}" loading="lazy" onerror="this.src='/img/_missing.svg'">
      </div>
      <div class="info">
        <div class="key">${r.key} ${statusBadge}</div>
        <div class="meta">${r.type} · ${r.origin}</div>
        <div class="meta">${r.facies || '—'}</div>
        <div class="size">${sizeLabel}</div>
        ${credit}
        <div class="actions">
          <button class="btn-ok"  onclick="act('${r.key}','ok')">✓ OK</button>
          <button class="btn-rej" onclick="act('${r.key}','reject')">✗ Reject</button>
          <button class="btn-ski" onclick="act('${r.key}','skip')">→ Skip</button>
        </div>
      </div>
    </div>`
  }).join('')

  const nav = ['all','quarantined','unreviewed'].map(f =>
    `<a href="/?filter=${f}" class="${filter===f?'active':''}">${f} (${
      f==='quarantined' ? rocks.filter(r=>r.imageStatus==='quarantined').length
      : f==='unreviewed' ? rocks.filter(r=>r.imageStatus==='verified'&&!metadata[r.key]).length
      : rocks.length
    })</a>`
  ).join(' | ')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Audit images roches — geo-france</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font: 14px/1.4 system-ui, sans-serif; background: #111; color: #ddd; padding: 16px }
  h1 { font-size: 18px; margin-bottom: 12px }
  nav { margin-bottom: 16px; font-size: 13px }
  nav a { color: #aef; text-decoration: none; padding: 4px 8px; border-radius: 4px }
  nav a.active { background: #334; color: #fff }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px }
  .card { background: #1e1e1e; border-radius: 8px; overflow: hidden; border: 1px solid #333 }
  .card-q { border-color: #a33 }
  .img-wrap { width: 100%; height: 180px; overflow: hidden; background: #0a0a0a }
  .img-wrap img { width: 100%; height: 100%; object-fit: cover }
  .info { padding: 10px }
  .key { font-weight: 600; font-size: 15px; margin-bottom: 4px }
  .meta { font-size: 12px; color: #888; margin-bottom: 2px }
  .size { font-size: 11px; color: #666; margin: 4px 0 }
  .credit { font-size: 11px; color: #667; margin: 6px 0 }
  .credit a { color: #556; }
  .credit.dim { color: #444 }
  .actions { display: flex; gap: 6px; margin-top: 8px }
  button { padding: 4px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px }
  .btn-ok  { background: #1a5c1a; color: #aef7ae }
  .btn-rej { background: #5c1a1a; color: #f7aeae }
  .btn-ski { background: #333; color: #aaa }
  .badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; margin-left: 4px; vertical-align: middle }
  .badge.q   { background: #522; color: #f88 }
  .badge.ok  { background: #151; color: #8f8 }
  .badge.rej { background: #511; color: #f88 }
  .badge.v   { background: #224; color: #88f }
  #toast { position:fixed; bottom:20px; right:20px; background:#333; color:#fff;
           padding:8px 14px; border-radius:6px; display:none; font-size:13px }
</style>
</head>
<body>
<h1>Audit images de roches (${rocks.length} entrées)</h1>
<nav>${nav}</nav>
<div class="grid">${cards || '<p style="color:#666;padding:20px">Aucune image dans ce filtre.</p>'}</div>
<div id="toast"></div>
<script>
async function act(key, action) {
  const r = await fetch('/validate?key=' + key + '&action=' + action, { method: 'POST' })
  const j = await r.json()
  const t = document.getElementById('toast')
  t.textContent = j.message
  t.style.display = 'block'
  setTimeout(() => { t.style.display = 'none'; if (action !== 'skip') location.reload() }, 1200)
}
</script>
</body>
</html>`
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)

  // Serve rock images
  if (url.pathname.startsWith('/img/')) {
    const name = url.pathname.slice(5) // e.g. argile.jpg
    const file = path.join(DEST, name)
    if (!existsSync(file)) {
      res.writeHead(404); res.end(); return
    }
    const ext = name.split('.').pop()?.toLowerCase()
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : 'image/jpeg'
    res.writeHead(200, { 'Content-Type': mime })
    res.end(readFileSync(file))
    return
  }

  // POST /validate
  if (url.pathname === '/validate' && req.method === 'POST') {
    const key = url.searchParams.get('key')
    const action = url.searchParams.get('action')
    if (!key || !action) { res.writeHead(400); res.end('{}'); return }

    const pending = loadJson(PENDING_FILE)
    if (action !== 'skip') pending[key] = action
    saveJson(PENDING_FILE, pending)

    const message = action === 'ok'
      ? `✓ ${key} validé — penser à retirer imageStatus:'quarantined' dans mineral-data.ts`
      : action === 'reject'
      ? `✗ ${key} rejeté — chercher manuellement une image de remplacement`
      : `→ ${key} ignoré`

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, message }))
    return
  }

  // GET / → page d'audit
  if (url.pathname === '/' || url.pathname === '') {
    const rocks = parseRockDB()
    const metadata = loadJson(META_FILE)
    const pending = loadJson(PENDING_FILE)
    const filter = url.searchParams.get('filter') ?? 'all'
    const html = buildHtml(rocks, metadata, pending, filter)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  res.writeHead(404); res.end()
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Audit rock images → http://localhost:${port}`)
  console.log(`  Filtres: /?filter=all | /?filter=quarantined | /?filter=unreviewed`)
  console.log(`  Ctrl+C pour arrêter\n`)
  // Ouvrir dans le navigateur
  try {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
    execSync(`${cmd} http://localhost:${port}/?filter=quarantined`)
  } catch { /* ignore if xdg-open fails */ }
})
