#!/usr/bin/env node
/**
 * CI guard : vérifie l'intégrité des images de roches avant le build.
 * Fail si : fichier absent, fichier < 10 Ko, ou image marquée quarantined mais non remplacée.
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
const MIN_SIZE = 10_000 // 10 Ko

const src = readFileSync(MINERAL_SRC, 'utf8')
// Extraire toutes les clés avec un champ `image:`
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
    console.error(`  ERREUR  ${key}: fichier absent — ${imgPath}`)
    errors++
    continue
  }

  const size = statSync(filePath).size
  if (size < MIN_SIZE) {
    console.error(`  ERREUR  ${key}: fichier trop petit (${Math.round(size / 1024)} Ko < 10 Ko) — probable vignette erronée`)
    errors++
    continue
  }

  if (quarantined.has(key)) {
    console.warn(`  WARN    ${key}: toujours en quarantaine — image non remplacée`)
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

console.log(`\nImages : ${total} total | ${quarantinedCount} quarantinées | ${metaCount} avec metadata`)
if (errors > 0) {
  console.error(`\n✗ ${errors} erreur(s) — build bloqué`)
  process.exit(1)
}
if (warnings > 0) {
  console.warn(`⚠ ${warnings} avertissement(s) — ${quarantinedCount} image(s) en quarantaine sans remplacement`)
}
console.log('✓ Validation images OK')
