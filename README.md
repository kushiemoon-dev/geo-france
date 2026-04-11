<div align="center">

### Interactive Geological Map of France

[![Live Demo](https://img.shields.io/badge/demo-geo--france.kushie.dev-blue?style=flat-square)](https://geo-france.kushie.dev)
[![Version](https://img.shields.io/badge/version-0.1.0-green?style=flat-square)](https://github.com/kushiemoon-dev/geo-france/releases)
[![License](https://img.shields.io/github/license/kushiemoon-dev/geo-france?style=flat-square&color=gray)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.x-396CB2?style=flat-square&logo=maplibre&logoColor=white)](https://maplibre.org)

</div>

---

## Overview

Interactive geological map of metropolitan France — 14 regions, ~1 million geological entities from the **BD Charm-50** dataset published by BRGM, rendered client-side with MapLibre GL JS and served from regional PMTiles archives. No tile server required.

---

## Features

- **14 regions** — Dynamic selector to navigate across metropolitan France
- **Geological formations** — ICS colors (International Chronostratigraphic Chart), from Precambrian to Quaternary
- **Tectonic structures** — Faults, folds, and dip points with degree values
- **Interactive popups** — Notation code, stratigraphic hierarchy, lithology, minerals, and fossils (~110 detected terms)
- **Layer controls** — Toggle geology, structures, and overlays independently
- **Color legend** by geological period
- **Geological notices** — 997 BRGM notice PDFs with page-count badges (full vs. pocket format)
- **Local mode** — 1:50,000 WMS raster overlay from BRGM with formation identification via BD Charm-50 vectors

---

## Data

**BD Charm-50** — Geological map of France at 1:50,000 published by [BRGM](https://www.brgm.fr/).

| | |
|---|---|
| **Coverage** | 14 metropolitan regions (excluding overseas territories) |
| **Source** | [data.cquest.org/brgm/bd_charm_50](https://data.cquest.org/brgm/bd_charm_50/2019/) |
| **Projection** | EPSG:2154 (Lambert 93) → EPSG:4326 (WGS84) |
| **Layers** | Formations (S_FGEOL), Boundaries (L_FGEOL), Structures (L_STRUCT, P_STRUCT), Overlays (S_SURCH) |
| **Size** | ~838 MB (14 PMTiles files, stored via Git LFS) |

---

## Stack

| Component | Role |
|-----------|------|
| [Vite](https://vitejs.dev/) + TypeScript | Build & dev server |
| [MapLibre GL JS](https://maplibre.org/) | Vector map rendering |
| [PMTiles](https://protomaps.com/docs/pmtiles) | Single-file tile archive |
| [OpenStreetMap](https://www.openstreetmap.org/) | Basemap |
| [Tippecanoe](https://github.com/felt/tippecanoe) | GeoJSON → vector tiles conversion |
| [GDAL](https://gdal.org/) | Shapefile reprojection & merging |

---

## Quick start

```bash
git clone https://github.com/kushiemoon-dev/geo-france.git
cd geo-france
npm install
npm run dev
```

Server starts at `http://localhost:5173`. PMTiles files (~838 MB) are downloaded automatically via Git LFS.

### Production build

```bash
npm run build
```

Static files in `dist/` can be served by any web server. A static server with byte-range support is recommended for PMTiles files.

---

## Data pipeline

Scripts in `scripts/` handle the full per-region conversion:

1. `scripts/regions.sh` — Region-to-department mapping
2. `scripts/convert.sh` — Single region conversion (download, reprojection, merge, PMTiles)
3. `scripts/convert-all.sh` — Runs conversion for all 14 regions

**Requirements:** `gdal`, `tippecanoe`, `curl`, `unzip`

```bash
cd scripts && bash convert-all.sh
```

---

## Credits

- [BRGM](https://www.brgm.fr/) — Geological data (BD Charm-50)
- [International Commission on Stratigraphy](https://stratigraphy.org/) — Chronostratigraphic chart & ICS colors
- [data.cquest.org](https://data.cquest.org/) — Open mirror of French public data
- [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) — Basemap

---

<div align="center">

**MIT License** · [Demo](https://geo-france.kushie.dev)

</div>
