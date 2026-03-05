#!/usr/bin/env bash
# Region-to-department mapping for all 13 metropolitan France regions
# Each region is an associative array entry: slug -> space-separated dept codes

declare -A REGION_DEPTS
declare -A REGION_NAMES

REGION_DEPTS[auvergne-rhone-alpes]="001 003 007 015 026 038 042 043 063 069 073 074"
REGION_NAMES[auvergne-rhone-alpes]="Auvergne-Rhone-Alpes"

REGION_DEPTS[bourgogne-franche-comte]="021 025 039 058 070 071 089 090"
REGION_NAMES[bourgogne-franche-comte]="Bourgogne-Franche-Comte"

REGION_DEPTS[bretagne]="022 029 035 056"
REGION_NAMES[bretagne]="Bretagne"

REGION_DEPTS[centre-val-de-loire]="018 028 036 037 041 045"
REGION_NAMES[centre-val-de-loire]="Centre-Val de Loire"

REGION_DEPTS[corse]="02A 02B"
REGION_NAMES[corse]="Corse"

REGION_DEPTS[grand-est]="008 010 051 052 054 055 057 067 068 088"
REGION_NAMES[grand-est]="Grand Est"

# 059+062 combined as NPC in BRGM data
REGION_DEPTS[hauts-de-france]="002 NPC 060 080"
REGION_NAMES[hauts-de-france]="Hauts-de-France"

# All IDF depts combined as IDF in BRGM data
REGION_DEPTS[ile-de-france]="IDF"
REGION_NAMES[ile-de-france]="Ile-de-France"

REGION_DEPTS[normandie]="014 027 050 061 076"
REGION_NAMES[normandie]="Normandie"

REGION_DEPTS[nouvelle-aquitaine]="016 017 019 023 024 033 040 047 064 079 086 087"
REGION_NAMES[nouvelle-aquitaine]="Nouvelle-Aquitaine"

REGION_DEPTS[occitanie]="009 011 012 030 031 032 034 046 048 065 066 081 082"
REGION_NAMES[occitanie]="Occitanie"

REGION_DEPTS[pays-de-la-loire]="044 049 053 072 085"
REGION_NAMES[pays-de-la-loire]="Pays de la Loire"

REGION_DEPTS[provence-alpes-cote-dazur]="004 005 006 013 083 084"
REGION_NAMES[provence-alpes-cote-dazur]="Provence-Alpes-Cote d'Azur"

# Combined ZIP files on the BRGM mirror (multiple depts in one archive)
# These use pseudo-codes (IDF, NPC) as dept identifiers
declare -A COMBINED_ZIPS
COMBINED_ZIPS[IDF]="GEO050K_HARM_075_077_078_091_092_093_094_095"
COMBINED_ZIPS[NPC]="GEO050K_HARM_059_062"

ALL_REGIONS=(
  auvergne-rhone-alpes
  bourgogne-franche-comte
  bretagne
  centre-val-de-loire
  corse
  grand-est
  hauts-de-france
  ile-de-france
  normandie
  nouvelle-aquitaine
  occitanie
  pays-de-la-loire
  provence-alpes-cote-dazur
)
