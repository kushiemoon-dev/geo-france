# Brotli Investigation — Hostinger

## Status : ACTIF

Brotli est **déjà actif** sur le déploiement Hostinger, via la combinaison LiteSpeed + Cloudflare.

---

## Test effectué

**URL testée :** `https://geo-france.kushie.dev/`  
**Date :** 2026-05-18

### HTML (index.html)

```
curl -sI -H "Accept-Encoding: br, gzip, deflate" https://geo-france.kushie.dev/
```

Headers de réponse pertinents :

```
content-encoding: br
x-turbo-charged-by: LiteSpeed
server: cloudflare
platform: hostinger
panel: hpanel
vary: Accept-Encoding
```

### JS asset (index-D20Ev-9o.js — 98 981 octets compressé)

```
curl -sI -H "Accept-Encoding: br, gzip, deflate" https://geo-france.kushie.dev/assets/index-D20Ev-9o.js
```

Headers de réponse pertinents :

```
content-encoding: br
content-length: 98981
etag: "b20d8-6a0b20a6-c6af636bc4d8aaeb;br"
x-turbo-charged-by: LiteSpeed
cf-cache-status: HIT
cache-control: public, max-age=31536000, immutable
```

L'ETag contient le suffixe `;br`, indiquant que LiteSpeed a pré-compressé le fichier côté serveur.

---

## Architecture détectée

```
Client → Cloudflare (CDN/proxy) → LiteSpeed (Hostinger hPanel) → fichiers statiques
```

- **LiteSpeed** gère la compression Brotli nativement (module `mod_brotli` intégré).
- **Cloudflare** propage l'encodage `br` en cache et aux clients compatibles.
- Aucune configuration `.htaccess` supplémentaire n'est nécessaire : Brotli est activé par défaut sur Hostinger hPanel avec LiteSpeed.

---

## Configuration .htaccess

Aucune directive Brotli à ajouter : le module est activé globalement par LiteSpeed.

Si jamais un ajustement fin est souhaité (qualité de compression, types MIME spécifiques), la directive applicable serait :

```apache
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css application/javascript application/json image/svg+xml
  BrotliCompressionQuality 6
</IfModule>
```

Mais cette configuration est superflue dans l'état actuel : tous les types compressibles le sont déjà.

---

## Prochaines étapes

- Aucune action requise pour Brotli — il est fonctionnel.
- Vérifier l'impact sur le score Lighthouse dans le ticket **F11** (Lighthouse final + rapport delta).
- Le fichier PMTiles (`.pmtiles`) n'est pas compressé par Brotli (normal : c'est un format binaire déjà optimisé, servi avec `Cache-Control: public, max-age=2592000, immutable`).
