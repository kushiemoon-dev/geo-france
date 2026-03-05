<div align="center">

### Carte Geologique Interactive de France

[![Live Demo](https://img.shields.io/badge/demo-geo--france.kushie.dev-blue?style=flat-square)](https://geo-france.kushie.dev)
[![License](https://img.shields.io/github/license/kushiemoon-dev/carte-geologique-france?style=flat-square&color=gray)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.x-396CB2?style=flat-square&logo=maplibre&logoColor=white)](https://maplibre.org)

</div>

---

## Overview

Carte geologique interactive de la France metropolitaine — 13 regions, ~1 million d'entites geologiques issues de la **BD Charm-50** du BRGM, rendues cote client avec MapLibre GL JS et servies depuis des archives PMTiles regionales. Aucun serveur de tuiles requis.

---

## Fonctionnalites

- **13 regions** — Selecteur dynamique pour naviguer entre les regions de France metropolitaine
- **Formations geologiques** — Couleurs ICS (Charte Chronostratigraphique Internationale), du Precambrien au Quaternaire
- **Structures tectoniques** — Failles, plis, et points de pendage avec valeurs en degres
- **Popups interactifs** — Code notation, hierarchie stratigraphique, lithologie, mineraux, et fossiles
- **Controle des couches** — Activer/desactiver geologie, structures, et surcharges independamment
- **Legende coloree** par periode geologique
- **Fonds de carte** — Satellite (Esri WorldImagery) et topographique (OpenTopoMap)

---

## Donnees

**BD Charm-50** — Carte geologique de France au 1:50 000 publiee par le [BRGM](https://www.brgm.fr/).

| | |
|---|---|
| **Couverture** | 13 regions metropolitaines (hors DOM-TOM) |
| **Source** | [data.cquest.org/brgm/bd_charm_50](https://data.cquest.org/brgm/bd_charm_50/2019/) |
| **Projection** | EPSG:2154 (Lambert 93) → EPSG:4326 (WGS84) |
| **Couches** | Formations (S_FGEOL), Limites (L_FGEOL), Structures (L_STRUCT, P_STRUCT), Surcharges (S_SURCH) |
| **Taille** | ~838 MB (13 fichiers PMTiles, stockes via Git LFS) |

---

## Stack

| Composant | Role |
|-----------|------|
| [Vite](https://vitejs.dev/) + TypeScript | Build & dev server |
| [MapLibre GL JS](https://maplibre.org/) | Rendu cartographique vectoriel |
| [PMTiles](https://protomaps.com/docs/pmtiles) | Archive de tuiles mono-fichier |
| [Tippecanoe](https://github.com/felt/tippecanoe) | Conversion GeoJSON → tuiles vectorielles |
| [GDAL](https://gdal.org/) | Reprojection & fusion des shapefiles |

---

## Demarrage rapide

```bash
git clone https://github.com/kushiemoon-dev/carte-geologique-france.git
cd carte-geologique-france
npm install
npm run dev
```

Le serveur demarre sur `http://localhost:5173`. Les fichiers PMTiles (~838 MB) sont telecharges automatiquement via Git LFS.

### Build de production

```bash
npm run build
```

Les fichiers statiques dans `dist/` peuvent etre servis par n'importe quel serveur web. Un serveur statique avec support byte-range est recommande pour les fichiers PMTiles.

---

## Pipeline de donnees

Les scripts dans `scripts/` gerent la conversion complete par region :

1. `scripts/regions.sh` — Definition des departements par region
2. `scripts/convert.sh` — Conversion d'une region (download, reprojection, fusion, PMTiles)
3. `scripts/convert-all.sh` — Lance la conversion pour les 13 regions

**Prerequis :** `gdal`, `tippecanoe`, `curl`, `unzip`

```bash
cd scripts && bash convert-all.sh
```

---

## Credits

- [BRGM](https://www.brgm.fr/) — Donnees geologiques (BD Charm-50)
- [Commission Internationale de Stratigraphie](https://stratigraphy.org/) — Charte chronostratigraphique & couleurs ICS
- [data.cquest.org](https://data.cquest.org/) — Miroir ouvert des donnees publiques francaises

---

<div align="center">

**MIT License** · [Demo](https://geo-france.kushie.dev)

</div>
