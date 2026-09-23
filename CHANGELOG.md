# Changelog

## v2.4.0 (2026-09-23)

### New features
- Era, period, and stage (ere/periode/etage) fields in the formation detail panel are now individually clickable, linking to their own French Wikipedia article when one exists, falling back to plain text otherwise. Each slug was verified against French Wikipedia before inclusion; the informal Trias-Lias compound label has no dedicated article and stays plain text by design.
- Added a dedicated link color token to the dark and light themes, with hover underline styling for detail panel and popup source links.

### Fixes
- Bumped `maplibre-gl` to v6 (critical vulnerability), which dropped its default export, so all imports switched to the namespace form. Also bumped `vitest` to a patched 4.x release and overrode `nanoid`, resolving all 8 npm audit advisories.
- Bumped `ws` to patch a memory-exhaustion DoS (GHSA), pulled in transitively via happy-dom/vite/vite-plugin-pwa (dev/test tooling only).
- Unified the project banner background color.

### Internal
- Screenshots added to the README, project banner added.
- GitHub Actions pinned to commit SHA.

## v2.3.1 (2026-07-17)

### Fixes
- Restored dense geology-outline contours at national zoom: the `minzoom: 8` added in v2.3.0 to fix outline overdraw hid ~1M polygon borders across all 13 stacked regions, flattening the visual density used to distinguish formations before zooming in

## v2.3.0 (2026-07-11)

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
- Explored a simplified 1:1M national PMTiles layer to cut load size; reverted after it diverged from prod's rendering and silenced several layer toggles, restored the original 13-region stacking for the national view, keeping the formation-labels toggle and color/fossil fixes made along the way
- Migrated from npm to pnpm; dead code and obsolete scripts removed (knip audit)
- French code comments translated to English

## v2.1.0 (2026-04-24)

### New features
- Rock image quality system: Commons scoring, blacklist filtering, title normalization, and a local HTTP audit tool (OK/Reject/Skip) backing a metadata.json of typed Wikimedia attribution; 54/62 lithologies verified
- Fossil enrichment pipeline pulling structured metadata, covering 981/997 BRGM sheets (98.4%)
- Accessibility pass to WCAG 2.1 AA: dialog role and focus trap on the detail panel, live regions on toasts, aria labels on topbar controls, 44x44px mobile touch targets
- PWA support via vite-plugin-pwa with app shell precache and cache-first rock images
- Light theme toggle (paper map palette) alongside the existing dark theme
- Sentry and Plausible telemetry, both opt-in via env vars
- CI workflow (typecheck, test, build), ESLint 10 flat config, Prettier, and 28 unit tests added

### Fixes
- Default region changed to "france" so the map opens on the full country instead of Normandie on first load, with a matching fix to avoid loading a nonexistent PMTiles source for that view
- Fossil extraction now also scans the stratigraphic summary text, surfacing fossils stage inference alone missed
- Licence attribution text corrected in the detail and info panels
- phtanite rock image rotated 180 degrees; colluvion and ampelite images removed pending a suitable specimen

## v0.2.2 (2026-04-16)

### Fixes
- Fossils inferred purely from geological stage removed; only fossils explicitly cited in the BRGM description are now shown, cutting false positives

## v0.2.1 (2026-04-14)

### New features
- Wikipedia links added to lithology and fossil tags
- 26 missing lithology rock images added from Wikimedia Commons

### Fixes
- Region assignments, fossil grouping, and WMS fallback corrected after audit
- 13 mis-assigned notice sheets moved to their correct region; LAVAL (0319) moved from Normandie to Pays-de-la-Loire
- Security: vite bumped to 7.3.2

## v0.1.0 (2026-04-11)

### Initial release
- Interactive map of France's geology built on MapLibre GL and 13 stacked PMTiles regions, with national and local (BRGM WMS 1:50k) view modes
- Formation detail panel with stratigraphic hierarchy, ICS color coding, mineral crystallographic data, and rock images sourced from Wikimedia Commons, later self-hosted to bypass browser Opaque Response Blocking on hotlinked images
- Notices panel linking all 997 BRGM geological map sheets, plus WMS GetFeatureInfo lookups and dip symbols oriented by azimuth
- Dark mode, SEO metadata, and a full UI/UX redesign under the Earth Tectonic design system before release
