# BRGM Notice Audit

> Generated on 2026-07-11 — source: `src/config/notices.ts`

## Summary

| Metric | Value |
|----------|-------:|
| Regions covered | 13 |
| Total notices | 997 |
| Unique sheets | 997 |
| Cross-region duplicates | 0 |
| Malformed / inconsistent URLs | 0 |

## Notices per region

| Region | Notices | Invalid URLs | Sample sheets |
|--------|--------:|:-------------:|-----------------|
| `nouvelle-aquitaine` | 144 | 0 | `0633`, `0634`, `0635` |
| `auvergne-rhone-alpes` | 118 | 0 | `0597`, `0598`, `0599` |
| `grand-est` | 113 | 0 | `0040`, `0052`, `0053` |
| `centre-val-de-loire` | 88 | 0 | `0216`, `0253`, `0254` |
| `occitanie` | 87 | 0 | `0786`, `0787`, `0788` |
| `bourgogne-franche-comte` | 81 | 0 | `0367`, `0368`, `0369` |
| `pays-de-la-loire` | 78 | 0 | `0248`, `0284`, `0285` |
| `hauts-de-france` | 72 | 0 | `0002`, `0003`, `0005` |
| `bretagne` | 60 | 0 | `0170`, `0171`, `0200` |
| `normandie` | 56 | 0 | `0057`, `0058`, `0059` |
| `provence-alpes-cote-dazur` | 55 | 0 | `0798`, `0823`, `0845` |
| `ile-de-france` | 38 | 0 | `0125`, `0126`, `0127` |
| `corse` | 7 | 0 | `1103`, `1110`, `1117` |

## Invalid or inconsistent URLs

_No invalid URLs detected._

## Cross-region duplicates

_No duplicates detected._

## Notes

- **Valid URL** = matches the pattern `http(s)://ficheinfoterre.brgm.fr/Notices/XXXXN.pdf`
  and the number in the URL matches the `sheet` field.
- Notices without a `pages`/`bytes` field are not considered invalid
  (these fields are optional).
