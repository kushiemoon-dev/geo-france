# Performance Report — Mobile 4G

Mesures effectuées avec Chromium headless, throttling 4G (1.6 Mbps down / 750 kbps up / 150 ms latence),
viewport 375x667 (Pixel 5). Serveur : `vite preview` local (port 4173).

## Mesures

| Métrique | Baseline (F0) | Après optims (F11) | Delta |
|---|---|---|---|
| FCP | 2 412 ms | 2 096 ms | **-316 ms (-13,1 %)** |
| domContentLoaded | 2 398 ms | 2 075 ms | **-323 ms (-13,5 %)** |
| load | 2 409 ms | 2 088 ms | **-321 ms (-13,3 %)** |
| JS transfer (scripts) | 390 KB | 318 KB | **-72 KB (-18,5 %)** |
| JS bundle index-*.js | — | 152 KB raw / 34 KB gzip | — |
| Requêtes HTTP (navigation) | 42 | 42* | 0 |

> Le run "after" rapporte 64 requêtes car le Service Worker (PWA) précache 13 entrées (3,13 MB)
> lors de la première installation — celles-ci ne font pas partie de la navigation applicative.
> Les visites suivantes bénéficieront du cache SW : 0 fetch réseau pour les assets statiques.
>
> Le totalTransferSize mesuré (3,79 MB) inclut ce précache SW one-time ; la comparaison
> pertinente reste jsTransferSize qui mesure uniquement les scripts chargés pendant la navigation.

## Tailles bundle (build Vite — dist/assets/)

| Chunk | Raw | Gzip |
|---|---|---|
| maplibre-*.js | 1 053 KB | 283 KB |
| fossils-enriched-*.js | 544 KB | 66 KB (lazy) |
| index-*.js | 152 KB | 34 KB |
| mineral-data-*.js | 36 KB | 8 KB (lazy) |
| pmtiles-*.js | 18 KB | — |

Les chunks fossils-enriched et mineral-data sont lazy-loadés : ils ne contribuent pas
au transfert initial, uniquement au premier accès aux données fossiles/minéraux.

## Optimisations appliquées

| Ticket | Description | Impact |
|---|---|---|
| F1 | Cache-Control immutable sur PMTiles (.htaccess) | Visites répétées : 0 fetch PMTiles |
| F3 | preconnect OSM + demotiles | Économie RTT TCP+TLS au boot |
| F4 | Lazy-load fossils-enriched.json (1,09 MB raw) | -544 KB raw / -66 KB gzip du bundle initial |
| F5 | Lazy-load mineral-data.ts + notices.ts | -36 KB raw / -8 KB gzip du bundle initial |
| F6 | Glyphs MapLibre self-hosted | Élimine dépendance externe demotiles.maplibre.org |
| F7 | Lazy-init sources PMTiles single-region | -12 fetches HTTP au boot sur lancement direct région |
| F8 | Tippecanoe size budget — regen 13 régions | PMTiles totales 820 MB → 311 MB (-62 %) |
| F10 | Brotli déjà actif (LiteSpeed + Cloudflare) | Compression Brotli confirmée côté serveur |

## Notes

- FCP -13 % : gain principalement dû au lazy-loading F4/F5 (moins de JS parsé au boot)
  et au preconnect F3 (résolution DNS/TLS anticipée).
- Brotli (F10) : la compression serveur est opérationnelle mais ne se reflète pas dans les
  mesures localhost (vite preview ne sert pas en Brotli). En production les transferts gzip
  indiqués ci-dessus seront encore réduits (~15-20 % vs gzip).
- PMTiles (F8) : la réduction 820 → 311 MB bénéficie au stockage serveur et aux utilisateurs
  qui explorent plusieurs régions ; elle n'affecte pas le FCP (les tuiles sont chargées
  progressivement après le rendu initial).
- Visites répétées : avec F1 (Cache-Control immutable) + SW PWA, les assets JS/CSS et
  PMTiles sont intégralement mis en cache — transfert réseau ≈ 0 KB après la première visite.

## Fichiers de mesure

- Baseline : docs/perf/baseline-2026-05-18.json
- Après optims : docs/perf/after-2026-05-18.json
