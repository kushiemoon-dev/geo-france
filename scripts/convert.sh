#!/usr/bin/env bash
set -euo pipefail

# BD Charm-50 data pipeline: Download, convert, merge, generate PMTiles
# Usage: ./convert.sh [region-slug]
# Example: ./convert.sh normandie
#          ./convert.sh bretagne

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/public/data"

source "$SCRIPT_DIR/regions.sh"

BASE_URL="https://data.cquest.org/brgm/bd_charm_50/2019"
LAYERS=(S_FGEOL L_FGEOL L_STRUCT P_STRUCT S_SURCH)

REGION="${1:-normandie}"

if [ -z "${REGION_DEPTS[$REGION]+x}" ]; then
  echo "Unknown region: $REGION"
  echo "Available regions:"
  printf '  %s\n' "${ALL_REGIONS[@]}"
  exit 1
fi

read -ra DEPARTMENTS <<< "${REGION_DEPTS[$REGION]}"
WORK_DIR="$PROJECT_DIR/data-work/$REGION"

mkdir -p "$WORK_DIR" "$OUTPUT_DIR"

echo "=== Region: ${REGION_NAMES[$REGION]} (${#DEPARTMENTS[@]} departments) ==="
echo "    Departments: ${DEPARTMENTS[*]}"

# ---- Step 1: Download ----
echo "=== Step 1: Downloading BD Charm-50 departments ==="
for dept in "${DEPARTMENTS[@]}"; do
  # Check if this dept is in a combined ZIP
  if [ -n "${COMBINED_ZIPS[$dept]+x}" ]; then
    zip_name="${COMBINED_ZIPS[$dept]}"
  else
    zip_name="GEO050K_HARM_${dept}"
  fi
  zip_file="$WORK_DIR/${zip_name}.zip"
  if [ -f "$zip_file" ]; then
    echo "  [skip] $zip_file already exists"
  else
    echo "  [download] Department $dept ($zip_name)..."
    wget -q --show-progress -O "$zip_file" "$BASE_URL/${zip_name}.zip" || {
      echo "  [warn] Failed to download department $dept — skipping"
      rm -f "$zip_file"
      continue
    }
  fi
done

# ---- Step 2: Extract ----
echo "=== Step 2: Extracting shapefiles ==="
for dept in "${DEPARTMENTS[@]}"; do
  if [ -n "${COMBINED_ZIPS[$dept]+x}" ]; then
    zip_name="${COMBINED_ZIPS[$dept]}"
    dept_dir="$WORK_DIR/dept_${zip_name}"
  else
    zip_name="GEO050K_HARM_${dept}"
    dept_dir="$WORK_DIR/dept_${dept}"
  fi
  zip_file="$WORK_DIR/${zip_name}.zip"
  if [ ! -f "$zip_file" ]; then
    echo "  [skip] No ZIP for department $dept"
    continue
  fi
  if [ -d "$dept_dir" ]; then
    echo "  [skip] $dept_dir already extracted"
  else
    echo "  [extract] Department $dept ($zip_name)..."
    mkdir -p "$dept_dir"
    unzip -qo "$zip_file" -d "$dept_dir"
  fi
done

# ---- Step 3: Convert to GeoJSON (EPSG:2154 -> EPSG:4326) ----
echo "=== Step 3: Converting shapefiles to GeoJSON ==="
for layer in "${LAYERS[@]}"; do
  for dept in "${DEPARTMENTS[@]}"; do
    geojson_out="$WORK_DIR/${layer}_${dept}.geojson"
    if [ -f "$geojson_out" ]; then
      echo "  [skip] $geojson_out exists"
      continue
    fi

    if [ -n "${COMBINED_ZIPS[$dept]+x}" ]; then
      dept_dir="$WORK_DIR/dept_${COMBINED_ZIPS[$dept]}"
    else
      dept_dir="$WORK_DIR/dept_${dept}"
    fi
    if [ ! -d "$dept_dir" ]; then
      continue
    fi

    # For combined ZIPs, match the specific dept code in the filename
    shp_file=$(find "$dept_dir" -name "*_${dept}_*_${layer}_*.shp" -print -quit 2>/dev/null || true)
    # Fallback: try without dept code prefix (some ZIPs use different naming)
    if [ -z "$shp_file" ]; then
      shp_file=$(find "$dept_dir" -name "*${dept}*${layer}*.shp" -print -quit 2>/dev/null || true)
    fi
    # Final fallback for single-dept ZIPs
    if [ -z "$shp_file" ]; then
      shp_file=$(find "$dept_dir" -name "*_${layer}_*.shp" -print -quit 2>/dev/null || true)
    fi
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
pmtiles_out="$OUTPUT_DIR/${REGION}.pmtiles"

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

echo "  [generate] ${REGION}.pmtiles..."
tippecanoe \
  -zg \
  --projection=EPSG:4326 \
  --force \
  --no-feature-limit \
  --no-tile-size-limit \
  -o "$pmtiles_out" \
  "${tippecanoe_args[@]}"

echo ""
echo "=== Done: $REGION ==="
echo "PMTiles output: $pmtiles_out"
pmtiles show "$pmtiles_out" 2>/dev/null || echo "(install pmtiles CLI to verify)"
echo "Total size: $(du -sh "$pmtiles_out" | cut -f1)"

# ---- Optional: Clean intermediate files ----
if [ "${CLEAN:-}" = "1" ]; then
  echo "  [clean] Removing intermediate files..."
  rm -rf "$WORK_DIR"
fi
