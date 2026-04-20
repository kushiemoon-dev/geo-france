# Architecture — geo-france

Carte géologique interactive de France. MapLibre GL JS + PMTiles + BRGM BD Charm-50.

## Stack

| Couche | Technologie |
|--------|-------------|
| Bundler | Vite 7 + TypeScript 5.9 strict |
| Carte | MapLibre GL JS 5 |
| Données | PMTiles (byte-range, pas de serveur tile) |
| Déploiement | Vercel (prod) / nginx (self-host) |
| Tests | Vitest 4 |
| Lint | ESLint 10 flat config + Prettier |

## Flux de données

```
BD Charm-50 shapefile (BRGM)
  └─ scripts/convert.sh (ogr2ogr → GeoJSON → tippecanoe)
       └─ public/data/<region>.pmtiles
            └─ MapLibre GL (pmtiles:// protocol)
                 └─ src/map/region-manager.ts  → charge la source
                      └─ src/layers/geology.ts → styles des couches
                           └─ src/controls/info-panel.ts / detail-panel.ts → clic → panneau détail
```

## Répertoires clés

```
src/
  config/          regions.ts, fossils-enriched.json
  controls/        detail-panel.ts, info-panel.ts, legend.ts, layer-toggle.ts
  core/            state.ts (Zustand-like store), events.ts (typed bus)
  layers/          geology.ts, faults.ts, dips.ts
  map/             setup.ts, region-manager.ts, map-mode.ts
  styles/          tokens.css, layout.css, a11y.css, …
  ui/              topbar.ts, bottom-sheet.ts, toast.ts, loading.ts
  utils/           geology-data.ts (classifyNotation, extractFossils, extractLithology)
                   mineral-data.ts (ROCK_DB, getRockInfo, hasUsableImage)
                   fossils-enriched.ts (getEnrichedFossils, mergeFossils)
                   colors.ts (LEGEND_PERIODS, couleurs stratigraphiques)

public/
  data/            *.pmtiles (non-gittés sauf les images)
  images/rocks/    *.jpg + metadata.json + ATTRIBUTIONS.md
  manifest.webmanifest, sitemap.xml, robots.txt, og-image.svg

scripts/
  convert.sh       pipeline région → PMTiles (GDAL + tippecanoe)
  fetch-rock-images.mjs    téléchargement images roches Wikimedia Commons
  validate-rock-images.mjs CI guard : taille + quarantaine + metadata
  audit-rock-images.mjs    serveur local audit visuel (port 5174)
  fetch-fossil-enrichment.mjs  pipeline fossils-enriched.json (BRGM notices)
```

## Panneau détail — flux complet

1. Clic polygone MapLibre → `info-panel.ts` → `openDetailPanel(feature)`
2. `detail-panel.ts:renderDetailContent` :
   - `classifyNotation(notation)` → ère/période/couleur/wikiSlug
   - `extractLithology(descr, legende)` → liste lithologies
   - `extractFossils(descr, legende)` → groupes fossiles textuels
   - `getEnrichedFossils(carte)` → fossiles notices BRGM (par coupure 1:50k)
   - `mergeFossils(extracted, enriched)` → fusion + enrichedSet
   - `findRockImage(lithology)` → image via LITHO_PRIORITY + ROCK_DB
3. Panel rendu avec `role="dialog"`, focus trap, ESC pour fermer, focus return

## Enrichissement fossiles

`src/config/fossils-enriched.json` : généré par `scripts/fetch-fossil-enrichment.mjs`.
Keyed par numéro coupure BRGM zero-paddé sur 4 digits (`"0365"`, `"1001"`…).
La feature MapLibre donne `CARTE` comme entier — `.padStart(4, '0')` dans `getEnrichedFossils`.

## Images roches — pipeline qualité

```
mineral-data.ts  imageStatus: 'quarantined'
  └─ fetch-rock-images.mjs --status=quarantined
       └─ Wikimedia Commons API (scoring : TITLE_BONUS, BLACKLIST, dimensions)
            └─ public/images/rocks/<key>.jpg
                 └─ metadata.json (attribution : title, author, license, url)
                      └─ validate-rock-images.mjs (CI guard : >10KB, metadata présente, pas quarantined)
```

## Régions

`src/config/regions.ts` : tableau `REGIONS` (id, name, bounds, center, zoom).
`region-manager.ts:addGeologySource` : charge `pmtiles:///data/${regionId}.pmtiles`.
Timeout 15s + `map.on('error')` → toast si données absentes.

## Ajout d'une nouvelle région

1. Télécharger shapefile BRGM département/région
2. `scripts/convert.sh <nom>` → génère `public/data/<nom>.pmtiles`
3. Ajouter entrée dans `src/config/regions.ts`
