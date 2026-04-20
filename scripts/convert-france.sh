#!/usr/bin/env bash
set -euo pipefail

# Pipeline France entière : BRGM 1:1 000 000 → PMTiles
# Usage: ./scripts/convert-france.sh
#
# Source : Carte géologique de la France à 1/1 000 000 (BRGM)
# Téléchargement via data.cquest.org (mirror open data) ou infoterre.brgm.fr
#
# Prérequis : ogr2ogr (GDAL), tippecanoe, pmtiles CLI
#   sudo pacman -S gdal tippecanoe   # ArchLinux
#
# Sortie : public/data/france.pmtiles
#
# Note schéma : les champs 1:1M sont normalisés en sortie pour correspondre
# au schéma 1:50k (Charm-50) déjà géré par le frontend :
#   CODE_GEO → NOTATION, NOM_FORM → LEGENDE, DESCRIPTION → DESCR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
WORK_DIR="$ROOT/data-work/france"
OUTPUT_DIR="$ROOT/public/data"
OUTPUT="$OUTPUT_DIR/france.pmtiles"

# URL du shapefile BRGM 1:1M (couche géologie)
# Source primaire : data.cquest.org/brgm/ — ajuster si l'URL change
DATASET_URL="https://data.cquest.org/brgm/geo_france_1m/GEO_FRANCE_1M.zip"
# Fallback InFoTerre : https://infoterre.brgm.fr/telechargements/France1M.zip
ZIP_FILE="$WORK_DIR/GEO_FRANCE_1M.zip"
EXTRACT_DIR="$WORK_DIR/extract"
GEOJSON="$WORK_DIR/france_1m.geojson"

mkdir -p "$WORK_DIR" "$OUTPUT_DIR"

# ── Étape 1 : Téléchargement ────────────────────────────────────────────────
echo "=== Étape 1 : Téléchargement BRGM 1:1M ==="
if [ -f "$ZIP_FILE" ]; then
  echo "  [skip] Archive déjà présente"
else
  echo "  [download] $DATASET_URL"
  wget -q --show-progress -O "$ZIP_FILE" "$DATASET_URL" || {
    echo ""
    echo "  [ERREUR] Téléchargement échoué."
    echo "  Télécharger manuellement la Carte géologique de France 1:1M depuis :"
    echo "    https://infoterre.brgm.fr  (onglet Téléchargements)"
    echo "    https://data.cquest.org/brgm/"
    echo "  Placer le ZIP dans : $ZIP_FILE"
    exit 1
  }
fi

# ── Étape 2 : Extraction ────────────────────────────────────────────────────
echo "=== Étape 2 : Extraction ==="
if [ -d "$EXTRACT_DIR" ]; then
  echo "  [skip] Déjà extrait"
else
  echo "  [extract] ..."
  mkdir -p "$EXTRACT_DIR"
  unzip -qo "$ZIP_FILE" -d "$EXTRACT_DIR"
fi

# Localiser le shapefile principal (couche formations géologiques)
SHP_FILE=$(find "$EXTRACT_DIR" -name "*.shp" | grep -i "geol\|form\|litho" | head -1 || true)
if [ -z "$SHP_FILE" ]; then
  SHP_FILE=$(find "$EXTRACT_DIR" -name "*.shp" | head -1 || true)
fi
if [ -z "$SHP_FILE" ]; then
  echo "  [ERREUR] Aucun shapefile trouvé dans $EXTRACT_DIR"
  echo "  Structure du ZIP :"
  ls -la "$EXTRACT_DIR"
  exit 1
fi
echo "  Shapefile : $SHP_FILE"

# Lister les champs disponibles pour diagnostic
echo "  Champs disponibles :"
ogrinfo -al -so "$SHP_FILE" 2>/dev/null | grep "^\s" || true

# ── Étape 3 : Conversion GeoJSON + normalisation champs ────────────────────
echo "=== Étape 3 : Conversion GeoJSON (EPSG:2154 → EPSG:4326) ==="
if [ -f "$GEOJSON" ]; then
  echo "  [skip] GeoJSON déjà généré"
else
  echo "  [convert + remap champs] ..."
  # Normaliser les noms de champs pour correspondre au schéma Charm-50 du frontend.
  # Adapter les noms de colonnes SQL si le schéma BRGM 1M diffère.
  # Exemples courants : CODE ou CODE_GEO → NOTATION, NOM ou NOM_FORM → LEGENDE, DESC* → DESCR
  ogr2ogr \
    -f GeoJSON \
    -t_srs EPSG:4326 \
    -sql "SELECT
      COALESCE(CODE_GEO, CODE, NOTATION, '') AS NOTATION,
      COALESCE(NOM_FORM, NOM, LEGENDE, '') AS LEGENDE,
      COALESCE(DESCRIPTION, DESC_FR, DESCR, '') AS DESCR,
      '' AS CARTE
    FROM \"$(basename "$SHP_FILE" .shp)\"" \
    "$GEOJSON" \
    "$SHP_FILE" 2>/dev/null || {
      echo "  [warn] SQL avec alias échoué, tentative sans remapping..."
      ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$GEOJSON" "$SHP_FILE"
    }
fi

echo "  Taille GeoJSON : $(du -sh "$GEOJSON" | cut -f1)"

# ── Étape 4 : Génération PMTiles ────────────────────────────────────────────
echo "=== Étape 4 : Génération PMTiles ==="
echo "  [generate] $OUTPUT ..."
tippecanoe \
  -z10 \
  --minimum-zoom=3 \
  --projection=EPSG:4326 \
  --force \
  --no-feature-limit \
  --no-tile-size-limit \
  --named-layer="S_FGEOL:$GEOJSON" \
  -o "$OUTPUT"

echo ""
echo "=== Terminé ==="
echo "PMTiles : $OUTPUT"
pmtiles show "$OUTPUT" 2>/dev/null || echo "(installer pmtiles CLI pour vérifier)"
echo "Taille  : $(du -sh "$OUTPUT" | cut -f1)"
echo ""
echo "→ Déployer $OUTPUT dans public/data/ du serveur."
echo "→ Dans l'app, sélectionner 'France entière' dans le menu région."

# ── Optionnel : nettoyage ────────────────────────────────────────────────────
if [ "${CLEAN:-}" = "1" ]; then
  echo "  [clean] Suppression fichiers intermédiaires..."
  rm -rf "$WORK_DIR"
fi
