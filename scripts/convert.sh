#!/usr/bin/env bash
set -euo pipefail

# BD Charm-50 data pipeline: Download, convert, merge, generate PMTiles
# Source: data.cquest.org/brgm/bd_charm_50/2019/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WORK_DIR="$PROJECT_DIR/data-work"
OUTPUT_DIR="$PROJECT_DIR/public/data"

BASE_URL="https://data.cquest.org/brgm/bd_charm_50/2019"
DEPARTMENTS=(014 027 050 061 076)

# Layers to extract from each department
# Actual layer names found in BD Charm-50 shapefiles
LAYERS=(S_FGEOL L_FGEOL L_STRUCT P_STRUCT S_SURCH)

mkdir -p "$WORK_DIR" "$OUTPUT_DIR"

# ---- Step 1: Download ----
echo "=== Step 1: Downloading BD Charm-50 departments ==="
for dept in "${DEPARTMENTS[@]}"; do
  zip_file="$WORK_DIR/GEO050K_HARM_${dept}.zip"
  if [ -f "$zip_file" ]; then
    echo "  [skip] $zip_file already exists"
  else
    echo "  [download] Department $dept..."
    wget -q --show-progress -O "$zip_file" "$BASE_URL/GEO050K_HARM_${dept}.zip"
  fi
done

# ---- Step 2: Extract ----
echo "=== Step 2: Extracting shapefiles ==="
for dept in "${DEPARTMENTS[@]}"; do
  dept_dir="$WORK_DIR/dept_${dept}"
  if [ -d "$dept_dir" ]; then
    echo "  [skip] $dept_dir already extracted"
  else
    echo "  [extract] Department $dept..."
    mkdir -p "$dept_dir"
    unzip -qo "$WORK_DIR/GEO050K_HARM_${dept}.zip" -d "$dept_dir"
  fi
done

# ---- Step 3: Convert to GeoJSON (EPSG:2154 → EPSG:4326) ----
echo "=== Step 3: Converting shapefiles to GeoJSON ==="
for layer in "${LAYERS[@]}"; do
  for dept in "${DEPARTMENTS[@]}"; do
    geojson_out="$WORK_DIR/${layer}_${dept}.geojson"
    if [ -f "$geojson_out" ]; then
      echo "  [skip] $geojson_out exists"
      continue
    fi

    # Find the shapefile for this layer in the department directory
    shp_file=$(find "$WORK_DIR/dept_${dept}" -name "*_${layer}_*.shp" -print -quit 2>/dev/null || true)
    if [ -z "$shp_file" ]; then
      echo "  [warn] No ${layer}.shp found for department $dept"
      continue
    fi

    echo "  [convert] ${layer} dept ${dept}..."
    ogr2ogr -f GeoJSON -t_srs EPSG:4326 -s_srs EPSG:2154 \
      "$geojson_out" "$shp_file" 2>/dev/null || {
        echo "  [error] Failed to convert ${layer} dept ${dept}"
        rm -f "$geojson_out"
      }
  done
done

# ---- Step 4: Merge departments per layer ----
echo "=== Step 4: Merging departments per layer ==="
for layer in "${LAYERS[@]}"; do
  merged="$WORK_DIR/${layer}_merged.geojson"
  if [ -f "$merged" ]; then
    echo "  [skip] $merged exists"
    continue
  fi

  inputs=()
  for dept in "${DEPARTMENTS[@]}"; do
    f="$WORK_DIR/${layer}_${dept}.geojson"
    if [ -f "$f" ]; then
      inputs+=("$f")
    fi
  done

  if [ ${#inputs[@]} -eq 0 ]; then
    echo "  [warn] No GeoJSON files found for layer $layer"
    continue
  fi

  echo "  [merge] ${layer} (${#inputs[@]} departments)..."

  # Merge by converting first to temp GPKG then to GeoJSON
  tmp_gpkg="$WORK_DIR/${layer}_merged.gpkg"
  rm -f "$tmp_gpkg"
  for input in "${inputs[@]}"; do
    if [ ! -f "$tmp_gpkg" ]; then
      ogr2ogr -f GPKG -nln "$layer" "$tmp_gpkg" "$input"
    else
      ogr2ogr -f GPKG -append -nln "$layer" "$tmp_gpkg" "$input"
    fi
  done
  ogr2ogr -f GeoJSON "$merged" "$tmp_gpkg" "$layer"
  rm -f "$tmp_gpkg"
done

# ---- Step 5: Generate PMTiles ----
echo "=== Step 5: Generating PMTiles ==="
pmtiles_out="$OUTPUT_DIR/normandy-geology.pmtiles"

# Collect all merged GeoJSON files with their layer names
tippecanoe_args=()
for layer in "${LAYERS[@]}"; do
  merged="$WORK_DIR/${layer}_merged.geojson"
  if [ -f "$merged" ]; then
    tippecanoe_args+=("--named-layer=${layer}:${merged}")
  fi
done

if [ ${#tippecanoe_args[@]} -eq 0 ]; then
  echo "  [error] No merged GeoJSON files found!"
  exit 1
fi

echo "  [generate] normandy-geology.pmtiles..."
tippecanoe \
  -zg \
  --projection=EPSG:4326 \
  --force \
  --no-feature-limit \
  --no-tile-size-limit \
  -o "$pmtiles_out" \
  "${tippecanoe_args[@]}"

echo ""
echo "=== Done! ==="
echo "PMTiles output: $pmtiles_out"
pmtiles show "$pmtiles_out" 2>/dev/null || echo "(install pmtiles CLI to verify)"
echo ""
echo "Total size: $(du -sh "$pmtiles_out" | cut -f1)"
