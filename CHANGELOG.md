# Changelog

## v2.3.1 — 2026-07-17

### Fixes
- Restored dense geology-outline contours at national zoom: the `minzoom: 8` added in v2.3.0 to fix outline overdraw hid ~1M polygon borders across all 13 stacked regions, flattening the visual density used to distinguish formations before zooming in

## v2.3.0 — 2026-07-11

### New features
- Per-formation image overrides for Brioverian formations (b1/b2/b1Ph/b1S)
- Clickable BRGM PDF notice link in the formation detail panel
- Wikipedia links for metamorphism type in the petrography section
- Toast notification when switching to the France-wide view
- BRGM geological notice inventory audit script

### Fixes
- Fossil term canonicalization: singular forms, NFC normalization, consistent between the app and the enrichment script, deduplicated after mapping
- Fossils hidden/cleared for Precambrian, magmatic, and Corsica (static R2 override) formations where they don't apply
- Fixed a coordinate offset so enriched fossils resolve correctly on regional PMTiles features
- Map click/hover/feature-query handlers now use dynamic layer IDs instead of hardcoded ones
- Faults split into major/minor with a minzoom override on zoom-out
- Layers panel now shows correctly in national mode; various layer-toggle, crystalline-color, and formation-label fixes
- Regional GeoJSON clipped to admin borders before tippecanoe; geological contours clipped to an accurate France border polygon (replacing a bounding-box placeholder)
- Quarantined rock images (argile, gres) removed from disk and metadata
- Granite image replaced with a representative hand specimen
- NOTATION classification, fossil attribution, and rendering issues resolved following an audit
- Security: vite, esbuild, and @babel/core bumped to patch advisories

### Performance
- Bundle size cut ~74% (730 kB → 187 kB raw) by lazy-loading fossil enrichment, notices, and mineral-data JSON behind dynamic imports
- Immutable cache headers for PMTiles; preconnect hints added for OSM tiles and other external origins
- MapLibre glyphs now self-hosted, removing the demotiles.maplibre.org dependency
- PMTiles sources lazy-initialized per region instead of loading all 13 upfront on single-region launches
- Lighthouse mobile baseline measurement script added

### Internal
- Explored a simplified 1:1M national PMTiles layer to cut load size; reverted after it diverged from prod's rendering and silenced several layer toggles — restored the original 13-region stacking for the national view, keeping the formation-labels toggle and color/fossil fixes made along the way
- Migrated from npm to pnpm; dead code and obsolete scripts removed (knip audit)
- French code comments translated to English
