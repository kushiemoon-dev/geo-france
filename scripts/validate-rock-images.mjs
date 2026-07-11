#!/usr/bin/env node
/**
 * CI guard: checks rock image integrity before the build.
 * Fails if: file missing, file < 10 KB, or image marked quarantined but not replaced.
 * Usage: node scripts/validate-rock-images.mjs
 */

import { existsSync, statSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dir, '..')
const DEST = path.join(ROOT, 'public', 'images', 'rocks')
const MINERAL_SRC = path.join(ROOT, 'src/utils/mineral-data.ts')
const META_FILE = path.join(DEST, 'metadata.json')
const MIN_SIZE = 10_000 // 10 KB

const src = readFileSync(MINERAL_SRC, 'utf8')
// Extract all keys with an `image:` field
const withImage = [...src.matchAll(/^\s{2}(\w+):\s*\{[^}\n]*image:\s*'([^']+)'/gm)]
  .map(m => ({ key: m[1], path: m[2] }))
const quarantined = new Set(
  [...src.matchAll(/^\s{2}(\w+):\s*\{[^}\n]*imageStatus:\s*'quarantined'/gm)].map(m => m[1])
)

let errors = 0
let warnings = 0

for (const { key, path: imgPath } of withImage) {
  const filePath = path.join(ROOT, 'public', imgPath)

  if (!existsSync(filePath)) {
    console.error(`  ERROR   ${key}: file missing — ${imgPath}`)
    errors++
    continue
  }

  const size = statSync(filePath).size
  if (size < MIN_SIZE) {
    console.error(`  ERROR   ${key}: file too small (${Math.round(size / 1024)} KB < 10 KB) — likely a broken thumbnail`)
    errors++
    continue
  }

  if (quarantined.has(key)) {
    console.warn(`  WARN    ${key}: still quarantined — image not replaced`)
    warnings++
  }
}

const total = withImage.length
const quarantinedCount = quarantined.size
let metaCount = 0
if (existsSync(META_FILE)) {
  try {
    metaCount = Object.keys(JSON.parse(readFileSync(META_FILE, 'utf8'))).length
  } catch { /* ignore */ }
}

console.log(`\nImages: ${total} total | ${quarantinedCount} quarantined | ${metaCount} with metadata`)
if (errors > 0) {
  console.error(`\n✗ ${errors} error(s) — build blocked`)
  process.exit(1)
}
if (warnings > 0) {
  console.warn(`⚠ ${warnings} warning(s) — ${quarantinedCount} quarantined image(s) without replacement`)
}
console.log('✓ Image validation OK')
