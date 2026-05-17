# Audit des notices BRGM

> Généré le 2026-05-17 — source : `src/config/notices.ts`

## Résumé

| Métrique | Valeur |
|----------|-------:|
| Régions couvertes | 13 |
| Notices totales | 997 |
| Sheets uniques | 997 |
| Doublons inter-régions | 0 |
| URL mal formées / incohérentes | 0 |

## Notices par région

| Région | Notices | URL invalides | Exemples sheets |
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

## URL invalides ou incohérentes

_Aucune URL invalide détectée._

## Doublons inter-régions

_Aucun doublon détecté._

## Notes

- **URL valide** = correspond au pattern `http(s)://ficheinfoterre.brgm.fr/Notices/XXXXN.pdf`
  et le numéro dans l'URL correspond au champ `sheet`.
- Les notices sans champ `pages`/`bytes` ne sont pas considérées comme invalides
  (ces champs sont optionnels).
