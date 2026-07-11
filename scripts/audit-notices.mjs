#!/usr/bin/env node
// scripts/audit-notices.mjs
// BRGM notice audit: per-region inventory, inconsistency detection

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const noticesTs = readFileSync(join(ROOT, 'src/config/notices.ts'), 'utf8')

// --- Parsing ---
// Extract per-region blocks: 'region-id': [ ... ]
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

  // Extract all notices from the block
  const noticeRe = /\{\s*sheet:\s*'(\d+)'[^}]*name:\s*'([^']*)'[^}]*url:\s*'([^']*)'/g
  const notices = []
  let nm
  while ((nm = noticeRe.exec(block)) !== null) {
    notices.push({ sheet: nm[1], name: nm[2], url: nm[3] })
  }
  regionBlocks[id] = notices
}

// --- Analysis ---
const BRGM_URL_RE = /^https?:\/\/ficheinfoterre\.brgm\.fr\/Notices\/(\d{4})N\.pdf$/
const allSheets = new Set()
const duplicateSheets = []

// First pass: collect all sheets to detect cross-region duplicates
for (const [region, notices] of Object.entries(regionBlocks)) {
  for (const n of notices) {
    if (allSheets.has(n.sheet)) {
      duplicateSheets.push({ sheet: n.sheet, region, name: n.name })
    }
    allSheets.add(n.sheet)
  }
}

// --- Report generation ---
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

// Sort by descending notice count
regionRows.sort((a, b) => b.count - a.count)

// Build the markdown table
const tableHeader = `| Region | Notices | Invalid URLs | Sample sheets |`
const tableSep =    `|--------|--------:|:-------------:|-----------------|`
const tableRows = regionRows.map(r =>
  `| \`${r.region}\` | ${r.count} | ${r.urlIssues > 0 ? `**${r.urlIssues}**` : '0'} | ${r.examples} |`
)

// Invalid URL detail section
const invalidSection = regionRows
  .filter(r => r.urlIssues > 0)
  .flatMap(r => {
    const bad = r.notices.filter(n => {
      if (!BRGM_URL_RE.test(n.url)) return true
      return n.url.match(BRGM_URL_RE)?.[1] !== n.sheet
    })
    return bad.map(n => `- \`${r.region}\` sheet \`${n.sheet}\` → \`${n.url}\``)
  })

// Duplicates section
const dupSection = duplicateSheets.length > 0
  ? duplicateSheets.map(d => `- sheet \`${d.sheet}\` (\`${d.name}\`) duplicated in \`${d.region}\``)
  : ['_No duplicates detected._']

const report = `# BRGM Notice Audit

> Generated on ${now} — source: \`src/config/notices.ts\`

## Summary

| Metric | Value |
|----------|-------:|
| Regions covered | ${regionRows.length} |
| Total notices | ${totalNotices} |
| Unique sheets | ${allSheets.size} |
| Cross-region duplicates | ${duplicateSheets.length} |
| Malformed / inconsistent URLs | ${regionRows.reduce((s, r) => s + r.urlIssues, 0)} |

## Notices per region

${tableHeader}
${tableSep}
${tableRows.join('\n')}

## Invalid or inconsistent URLs

${invalidSection.length > 0 ? invalidSection.join('\n') : '_No invalid URLs detected._'}

## Cross-region duplicates

${dupSection.join('\n')}

## Notes

- **Valid URL** = matches the pattern \`http(s)://ficheinfoterre.brgm.fr/Notices/XXXXN.pdf\`
  and the number in the URL matches the \`sheet\` field.
- Notices without a \`pages\`/\`bytes\` field are not considered invalid
  (these fields are optional).
`

writeFileSync(join(ROOT, 'docs/notices-audit-report.md'), report, 'utf8')
console.log(`Report generated: docs/notices-audit-report.md`)
console.log(`  ${regionRows.length} regions, ${totalNotices} notices, ${allSheets.size} unique sheets`)
if (duplicateSheets.length) console.warn(`  ⚠ ${duplicateSheets.length} cross-region duplicates`)
const totalInvalid = regionRows.reduce((s, r) => s + r.urlIssues, 0)
if (totalInvalid) console.warn(`  ⚠ ${totalInvalid} invalid URLs`)
else console.log(`  All URLs are well-formed.`)
