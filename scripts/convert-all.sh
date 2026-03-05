#!/usr/bin/env bash
set -euo pipefail

# Orchestrate all 13 regions, 3 at a time
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/regions.sh"

echo "=== Converting all ${#ALL_REGIONS[@]} regions (3 parallel) ==="

if command -v parallel &>/dev/null; then
  parallel -j3 "$SCRIPT_DIR/convert.sh" ::: "${ALL_REGIONS[@]}"
else
  echo "[warn] GNU parallel not found, running sequentially"
  for region in "${ALL_REGIONS[@]}"; do
    "$SCRIPT_DIR/convert.sh" "$region"
  done
fi

echo ""
echo "=== All regions complete ==="
ls -lh "$SCRIPT_DIR/../public/data/"*.pmtiles 2>/dev/null || echo "No PMTiles files found"
