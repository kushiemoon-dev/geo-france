#!/usr/bin/env node
// scripts/audit-notices.mjs
// Audit des notices BRGM : inventaire par région, détection d'incohérences

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const noticesTs = readFileSync(join(ROOT, 'src/config/notices.ts'), 'utf8')

// --- Parsing ---
// Extraire les blocs par région : 'region-id': [ ... ]
const regionBlocks = {}
const regionHeaderRe = /^\s+'([\w-]+)':\s*\[/gm
let match
const regionStarts = []

while ((match = regionHeaderRe.exec(noticesTs)) !== null) {
  regionStarts.push({ id: match[1], pos: match.index })
}

for (let i = 0; i < regionStarts.length; i++) {
  const { id, pos } = regionStarts[i]
  const end = i + 1 < regionStarts.length ? regionStarts[i + 1].pos : noticesTs.length
  const block = noticesTs.slice(pos, end)

  // Extraire toutes les notices du bloc
  const noticeRe = /\{\s*sheet:\s*'(\d+)'[^}]*name:\s*'([^']*)'[^}]*url:\s*'([^']*)'/g
  const notices = []
  let nm
  while ((nm = noticeRe.exec(block)) !== null) {
    notices.push({ sheet: nm[1], name: nm[2], url: nm[3] })
  }
  regionBlocks[id] = notices
}

// --- Analyse ---
const BRGM_URL_RE = /^https?:\/\/ficheinfoterre\.brgm\.fr\/Notices\/(\d{4})N\.pdf$/
const allSheets = new Set()
const duplicateSheets = []

// Première passe : collecter tous les sheets pour détecter les doublons inter-régions
for (const [region, notices] of Object.entries(regionBlocks)) {
  for (const n of notices) {
    if (allSheets.has(n.sheet)) {
      duplicateSheets.push({ sheet: n.sheet, region, name: n.name })
    }
    allSheets.add(n.sheet)
  }
}

// --- Génération du rapport ---
const now = new Date().toISOString().slice(0, 10)
let totalNotices = 0
const regionRows = []

for (const [region, notices] of Object.entries(regionBlocks)) {
  totalNotices += notices.length

  const urlIssues = notices.filter(n => {
    if (!BRGM_URL_RE.test(n.url)) return true
    const urlSheet = n.url.match(BRGM_URL_RE)?.[1]
    return urlSheet !== n.sheet
  })

  const examples = notices.slice(0, 3).map(n => `\`${n.sheet}\``).join(', ')

  regionRows.push({ region, count: notices.length, urlIssues: urlIssues.length, examples, notices })
}

// Trier par nombre de notices décroissant
regionRows.sort((a, b) => b.count - a.count)

// Construire le tableau markdown
const tableHeader = `| Région | Notices | URL invalides | Exemples sheets |`
const tableSep =    `|--------|--------:|:-------------:|-----------------|`
const tableRows = regionRows.map(r =>
  `| \`${r.region}\` | ${r.count} | ${r.urlIssues > 0 ? `**${r.urlIssues}**` : '0'} | ${r.examples} |`
)

// Section détail des URL invalides
const invalidSection = regionRows
  .filter(r => r.urlIssues > 0)
  .flatMap(r => {
    const bad = r.notices.filter(n => {
      if (!BRGM_URL_RE.test(n.url)) return true
      return n.url.match(BRGM_URL_RE)?.[1] !== n.sheet
    })
    return bad.map(n => `- \`${r.region}\` sheet \`${n.sheet}\` → \`${n.url}\``)
  })

// Section doublons
const dupSection = duplicateSheets.length > 0
  ? duplicateSheets.map(d => `- sheet \`${d.sheet}\` (\`${d.name}\`) dupliquée dans \`${d.region}\``)
  : ['_Aucun doublon détecté._']

const report = `# Audit des notices BRGM

> Généré le ${now} — source : \`src/config/notices.ts\`

## Résumé

| Métrique | Valeur |
|----------|-------:|
| Régions couvertes | ${regionRows.length} |
| Notices totales | ${totalNotices} |
| Sheets uniques | ${allSheets.size} |
| Doublons inter-régions | ${duplicateSheets.length} |
| URL mal formées / incohérentes | ${regionRows.reduce((s, r) => s + r.urlIssues, 0)} |

## Notices par région

${tableHeader}
${tableSep}
${tableRows.join('\n')}

## URL invalides ou incohérentes

${invalidSection.length > 0 ? invalidSection.join('\n') : '_Aucune URL invalide détectée._'}

## Doublons inter-régions

${dupSection.join('\n')}

## Notes

- **URL valide** = correspond au pattern \`http(s)://ficheinfoterre.brgm.fr/Notices/XXXXN.pdf\`
  et le numéro dans l'URL correspond au champ \`sheet\`.
- Les notices sans champ \`pages\`/\`bytes\` ne sont pas considérées comme invalides
  (ces champs sont optionnels).
`

writeFileSync(join(ROOT, 'docs/notices-audit-report.md'), report, 'utf8')
console.log(`Rapport généré : docs/notices-audit-report.md`)
console.log(`  ${regionRows.length} régions, ${totalNotices} notices, ${allSheets.size} sheets uniques`)
if (duplicateSheets.length) console.warn(`  ⚠ ${duplicateSheets.length} doublons inter-régions`)
const totalInvalid = regionRows.reduce((s, r) => s + r.urlIssues, 0)
if (totalInvalid) console.warn(`  ⚠ ${totalInvalid} URL invalides`)
else console.log(`  Toutes les URLs sont bien formées.`)
