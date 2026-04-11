#!/usr/bin/env node
/**
 * Télécharge les images manquantes pour les lithologies sans photo dans ROCK_DB.
 * Sources: Wikimedia Commons (CC-BY-SA / domaine public).
 * Usage: node scripts/fetch-rock-images.mjs
 */

import { createWriteStream, existsSync, mkdirSync, appendFileSync } from 'fs'
import { pipeline } from 'stream/promises'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const DEST = path.join(__dir, '..', 'public', 'images', 'rocks')
const ATTR_FILE = path.join(DEST, 'ATTRIBUTIONS.md')

// Mapping lithologie -> URL Wikimedia Commons (CC-BY-SA ou domaine public)
// Toutes les URL sont des liens directs vers une image (pas la page de description).
const IMAGES = {
  spilite:    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Spilite_-_geograph.org.uk.jpg/640px-Spilite_-_geograph.org.uk.jpg',
  tuf:        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Volcanic_tuff.jpg/640px-Volcanic_tuff.jpg',
  cinerite:   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cinerite_de_Volvic.JPG/640px-Cinerite_de_Volvic.JPG',
  lumachelle:  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Lumachelle.jpg/640px-Lumachelle.jpg',
  oolite:     'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Oolite_limestone.jpg/640px-Oolite_limestone.jpg',
  falun:      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Falun-la-chapelle-vendômoise.jpg/640px-Falun-la-chapelle-vendômoise.jpg',
  sable:      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Sand_from_Gobi_Desert.jpg/640px-Sand_from_Gobi_Desert.jpg',
  poudingue:  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Conglomerado_en_Las_Bardenas_Reales.jpg/640px-Conglomerado_en_Las_Bardenas_Reales.jpg',
  siltite:    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Siltstone_2.jpg/640px-Siltstone_2.jpg',
  argilite:   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Argillite_Close_Up.jpg/640px-Argillite_Close_Up.jpg',
  gaize:      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Gaize_de_l%27Argonne.jpg/640px-Gaize_de_l%27Argonne.jpg',
  meuliere:   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Meulière_de_Fontainebleau.jpg/640px-Meulière_de_Fontainebleau.jpg',
  radiolarite: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Radiolarite.jpg/640px-Radiolarite.jpg',
  breche:     'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Breccia.jpg/640px-Breccia.jpg',
  tillite:    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diamictite.jpg/640px-Diamictite.jpg',
  limon:      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Silt_soil.jpg/640px-Silt_soil.jpg',
  colluvion:  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Colluvial_soil.jpg/640px-Colluvial_soil.jpg',
  greze:      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Greze_litee.jpg/640px-Greze_litee.jpg',
  tourbe:     'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Peat_deposit.jpg/640px-Peat_deposit.jpg',
  tangue:     'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Mont-Saint-Michel-bay-sand.jpg/640px-Mont-Saint-Michel-bay-sand.jpg',
  alterite:   'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Laterite_soil_profile.jpg/640px-Laterite_soil_profile.jpg',
  corneenne:  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hornfels_contact_metamorphism.jpg/640px-Hornfels_contact_metamorphism.jpg',
  phyllade:   'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Phyllite_sample.jpg/640px-Phyllite_sample.jpg',
  ampelite:   'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ampelite.jpg/640px-Ampelite.jpg',
  phtanite:   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Chert_BIF_banded_iron_formation.jpg/640px-Chert_BIF_banded_iron_formation.jpg',
  pelite:     'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Mudstone_sample.jpg/640px-Mudstone_sample.jpg',
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'brgmremaster-image-fetcher/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return }
      resolve(res)
    })
    req.on('error', reject)
  })
}

mkdirSync(DEST, { recursive: true })

if (!existsSync(ATTR_FILE)) {
  appendFileSync(ATTR_FILE, '# Attributions images lithologies\n\nSource: Wikimedia Commons (CC-BY-SA sauf mention)\n\n')
}

let ok = 0, skipped = 0, failed = 0

for (const [name, url] of Object.entries(IMAGES)) {
  const dest = path.join(DEST, `${name}.jpg`)
  if (existsSync(dest)) {
    console.log(`  skip  ${name}.jpg (déjà présent)`)
    skipped++
    continue
  }
  try {
    const stream = await fetchUrl(url)
    await pipeline(stream, createWriteStream(dest))
    console.log(`  ok    ${name}.jpg`)
    appendFileSync(ATTR_FILE, `- **${name}.jpg** : ${url}\n`)
    ok++
  } catch (err) {
    console.warn(`  FAIL  ${name}.jpg — ${err.message}`)
    console.warn(`         → Remplacer manuellement dans public/images/rocks/${name}.jpg`)
    failed++
  }
}

console.log(`\nTerminé: ${ok} téléchargés, ${skipped} ignorés, ${failed} échoués`)
if (failed > 0) {
  console.log('Pour les images échouées, chercher sur https://commons.wikimedia.org')
}
