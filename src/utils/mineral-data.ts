export interface MineralInfo {
  readonly formula: string
  readonly crystalSystem?: string
  readonly hardness: string
  readonly category: string
}

const MINERAL_DB: Record<string, MineralInfo> = {
  quartz: { formula: 'SiO\u2082', crystalSystem: 'trigonal', hardness: '7', category: 'silicate' },
  feldspath: { formula: '(K,Na,Ca)(Al,Si)\u2084O\u2088', crystalSystem: 'monoclinique/triclinique', hardness: '6-6.5', category: 'silicate' },
  biotite: { formula: 'K(Mg,Fe)\u2083AlSi\u2083O\u2081\u2080(OH)\u2082', crystalSystem: 'monoclinique', hardness: '2.5-3', category: 'silicate' },
  muscovite: { formula: 'KAl\u2082(AlSi\u2083O\u2081\u2080)(OH)\u2082', crystalSystem: 'monoclinique', hardness: '2-2.5', category: 'silicate' },
  cordierite: { formula: '(Mg,Fe)\u2082Al\u2084Si\u2085O\u2081\u2088', crystalSystem: 'orthorhombique', hardness: '7-7.5', category: 'silicate' },
  amphibole: { formula: 'Ca\u2082(Mg,Fe)\u2085Si\u2088O\u2082\u2082(OH)\u2082', hardness: '5-6', category: 'silicate' },
  pyroxene: { formula: '(Ca,Mg,Fe)SiO\u2083', hardness: '5-6', category: 'silicate' },
  olivine: { formula: '(Mg,Fe)\u2082SiO\u2084', crystalSystem: 'orthorhombique', hardness: '6.5-7', category: 'silicate' },
  grenat: { formula: 'X\u2083Y\u2082(SiO\u2084)\u2083', crystalSystem: 'cubique', hardness: '6.5-7.5', category: 'silicate' },
  tourmaline: { formula: 'Na(Mg,Fe)\u2083Al\u2086(BO\u2083)\u2083Si\u2086O\u2081\u2088(OH)\u2084', crystalSystem: 'trigonal', hardness: '7-7.5', category: 'silicate' },
  chlorite: { formula: '(Mg,Fe)\u2085Al(AlSi\u2083O\u2081\u2080)(OH)\u2088', crystalSystem: 'monoclinique', hardness: '2-2.5', category: 'silicate' },
  calcite: { formula: 'CaCO\u2083', crystalSystem: 'trigonal', hardness: '3', category: 'carbonate' },
  dolomite: { formula: 'CaMg(CO\u2083)\u2082', crystalSystem: 'trigonal', hardness: '3.5-4', category: 'carbonate' },
  glauconie: { formula: '(K,Na)(Fe,Al,Mg)\u2082(Si,Al)\u2084O\u2081\u2080(OH)\u2082', crystalSystem: 'monoclinique', hardness: '2', category: 'silicate' },
  silice: { formula: 'SiO\u2082', hardness: '7', category: 'oxyde' },
  pyrite: { formula: 'FeS\u2082', crystalSystem: 'cubique', hardness: '6-6.5', category: 'sulfure' },
  mica: { formula: 'KAl\u2082(AlSi\u2083O\u2081\u2080)(OH)\u2082', crystalSystem: 'monoclinique', hardness: '2-3', category: 'silicate' },
  plagioclase: { formula: '(Na,Ca)(Al,Si)\u2084O\u2088', crystalSystem: 'triclinique', hardness: '6-6.5', category: 'silicate' },
  orthose: { formula: 'KAlSi\u2083O\u2088', crystalSystem: 'monoclinique', hardness: '6', category: 'silicate' },
  staurotide: { formula: 'Fe\u2082Al\u2089O\u2086(SiO\u2084)\u2084(OH)\u2082', crystalSystem: 'monoclinique', hardness: '7-7.5', category: 'silicate' },
  andalousite: { formula: 'Al\u2082SiO\u2085', crystalSystem: 'orthorhombique', hardness: '7.5', category: 'silicate' },
  sillimanite: { formula: 'Al\u2082SiO\u2085', crystalSystem: 'orthorhombique', hardness: '6-7', category: 'silicate' },
  disthene: { formula: 'Al\u2082SiO\u2085', crystalSystem: 'triclinique', hardness: '5-7', category: 'silicate' },
  apatite: { formula: 'Ca\u2085(PO\u2084)\u2083(F,Cl,OH)', crystalSystem: 'hexagonal', hardness: '5', category: 'phosphate' },
  zircon: { formula: 'ZrSiO\u2084', crystalSystem: 'tetragonal', hardness: '7.5', category: 'silicate' },
  magnetite: { formula: 'Fe\u2083O\u2084', crystalSystem: 'cubique', hardness: '5.5-6.5', category: 'oxyde' },
  ilmenite: { formula: 'FeTiO\u2083', crystalSystem: 'trigonal', hardness: '5-6', category: 'oxyde' },
  hematite: { formula: 'Fe\u2082O\u2083', crystalSystem: 'trigonal', hardness: '5.5-6.5', category: 'oxyde' },
  limonite: { formula: 'FeO(OH)\u00B7nH\u2082O', hardness: '4-5.5', category: 'oxyde' },
  siderite: { formula: 'FeCO\u2083', crystalSystem: 'trigonal', hardness: '3.5-4.5', category: 'carbonate' },
  barytine: { formula: 'BaSO\u2084', crystalSystem: 'orthorhombique', hardness: '3-3.5', category: 'sulfate' },
  fer: { formula: 'Fe', crystalSystem: 'cubique', hardness: '4', category: 'element natif' },
  kaolin: { formula: 'Al\u2082Si\u2082O\u2085(OH)\u2084', crystalSystem: 'triclinique', hardness: '2-2.5', category: 'silicate' },
  phosphate: { formula: 'PO\u2084\u00B3\u207B', hardness: '5', category: 'phosphate' },
  gypse: { formula: 'CaSO\u2084\u00B72H\u2082O', crystalSystem: 'monoclinique', hardness: '2', category: 'sulfate' },
  anhydrite: { formula: 'CaSO\u2084', crystalSystem: 'orthorhombique', hardness: '3-3.5', category: 'sulfate' },
  fluorine: { formula: 'CaF\u2082', crystalSystem: 'cubique', hardness: '4', category: 'halogenure' },
  galene: { formula: 'PbS', crystalSystem: 'cubique', hardness: '2.5', category: 'sulfure' },
  blende: { formula: 'ZnS', crystalSystem: 'cubique', hardness: '3.5-4', category: 'sulfure' },
  majorite: { formula: 'Mg\u2083(MgSi)(SiO\u2084)\u2083', crystalSystem: 'cubique', hardness: '7-7.5', category: 'silicate' },
  lignite: { formula: 'C (organique)', hardness: '1-2', category: 'organique' },
  blavierite: { formula: 'Al\u2082SiO\u2085', crystalSystem: 'orthorhombique', hardness: '7.5', category: 'silicate' },
}

// Accent variants map to the same canonical entry
const ACCENT_ALIASES: Record<string, string> = {
  'cordiérite': 'cordierite',
  'pyroxène': 'pyroxene',
  'staurolite': 'staurotide',
  'disthène': 'disthene',
  'magnétite': 'magnetite',
  'ilménite': 'ilmenite',
  'hématite': 'hematite',
  'sidérite': 'siderite',
  'galène': 'galene',
}

export function getMineralInfo(name: string): MineralInfo | undefined {
  const key = name.toLowerCase()
  const canonical = ACCENT_ALIASES[key] ?? key
  return MINERAL_DB[canonical]
}
