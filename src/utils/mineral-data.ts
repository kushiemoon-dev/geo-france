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

// --- Rock petrography database ---

export interface RockMineral {
  readonly name: string
  readonly percent: string
}

export type ImageStatus = 'verified' | 'quarantined' | 'missing'

export interface ImageSource {
  readonly title: string
  readonly author: string
  readonly license: string
  readonly url: string
}

export interface RockInfo {
  readonly type: string
  readonly origin: string
  readonly facies?: string
  readonly texture?: string
  readonly minerals: readonly RockMineral[]
  readonly image?: string
  readonly imageStatus?: ImageStatus
  readonly imageSource?: ImageSource
}

const ROCK_DB: Record<string, RockInfo> = {
  // Magmatiques plutoniques
  granite: { type: 'magmatique', origin: 'plutonique', facies: 'Granite a biotite dominant, calco-alcalin', texture: 'Grenue, grain moyen, parfois porphyroide', image: '/images/rocks/granite.jpg', minerals: [
    { name: 'feldspath', percent: '32%' }, { name: 'plagioclase', percent: '28%' }, { name: 'quartz', percent: '25%' }, { name: 'biotite', percent: '12%' }, { name: 'amphibole', percent: '3%' }
  ]},
  granodiorite: { type: 'magmatique', origin: 'plutonique', facies: 'Granodiorite calco-alcaline', texture: 'Grenue', image: '/images/rocks/granodiorite.jpg', minerals: [
    { name: 'plagioclase', percent: '40%' }, { name: 'quartz', percent: '25%' }, { name: 'feldspath', percent: '15%' }, { name: 'biotite', percent: '12%' }, { name: 'amphibole', percent: '8%' }
  ]},
  tonalite: { type: 'magmatique', origin: 'plutonique', facies: 'Tonalite sodique', texture: 'Grenue', image: '/images/rocks/tonalite.jpg', minerals: [
    { name: 'plagioclase', percent: '50%' }, { name: 'quartz', percent: '25%' }, { name: 'biotite', percent: '15%' }, { name: 'amphibole', percent: '10%' }
  ]},
  diorite: { type: 'magmatique', origin: 'plutonique', facies: 'Diorite quartzique', texture: 'Grenue', image: '/images/rocks/diorite.jpg', minerals: [
    { name: 'plagioclase', percent: '55%' }, { name: 'amphibole', percent: '25%' }, { name: 'biotite', percent: '10%' }, { name: 'quartz', percent: '10%' }
  ]},
  leucogranite: { type: 'magmatique', origin: 'plutonique', facies: 'Leucogranite a muscovite', texture: 'Grenue a grain fin', image: '/images/rocks/leucogranite.jpg', minerals: [
    { name: 'feldspath', percent: '35%' }, { name: 'quartz', percent: '35%' }, { name: 'muscovite', percent: '15%' }, { name: 'plagioclase', percent: '15%' }
  ]},
  trondhjemite: { type: 'magmatique', origin: 'plutonique', facies: 'Trondhjemite sodique', texture: 'Grenue', image: '/images/rocks/trondhjemite.jpg', minerals: [
    { name: 'plagioclase', percent: '55%' }, { name: 'quartz', percent: '30%' }, { name: 'biotite', percent: '10%' }, { name: 'muscovite', percent: '5%' }
  ]},
  microgranite: { type: 'magmatique', origin: 'filonienne', facies: 'Microgranite porphyrique', texture: 'Microgrenue porphyrique', image: '/images/rocks/microgranite.jpg', minerals: [
    { name: 'feldspath', percent: '35%' }, { name: 'quartz', percent: '30%' }, { name: 'plagioclase', percent: '20%' }, { name: 'biotite', percent: '10%' }, { name: 'muscovite', percent: '5%' }
  ]},

  // Magmatiques volcaniques
  basalte: { type: 'magmatique', origin: 'volcanique', facies: 'Basalte tholeiitique a alcalin', texture: 'Microlitique, parfois porphyrique', image: '/images/rocks/basalte.jpg', minerals: [
    { name: 'plagioclase', percent: '50%' }, { name: 'pyroxene', percent: '30%' }, { name: 'olivine', percent: '15%' }, { name: 'magnetite', percent: '5%' }
  ]},
  rhyolite: { type: 'magmatique', origin: 'volcanique', facies: 'Rhyolite alcaline', texture: 'Vitreuse a microlitique', image: '/images/rocks/rhyolite.jpg', minerals: [
    { name: 'quartz', percent: '35%' }, { name: 'feldspath', percent: '35%' }, { name: 'plagioclase', percent: '15%' }, { name: 'biotite', percent: '10%' }, { name: 'magnetite', percent: '5%' }
  ]},
  andesite: { type: 'magmatique', origin: 'volcanique', facies: 'Andesite calco-alcaline', texture: 'Microlitique porphyrique', image: '/images/rocks/andesite.jpg', minerals: [
    { name: 'plagioclase', percent: '55%' }, { name: 'pyroxene', percent: '20%' }, { name: 'amphibole', percent: '15%' }, { name: 'magnetite', percent: '10%' }
  ]},
  dacite: { type: 'magmatique', origin: 'volcanique', facies: 'Dacite', texture: 'Microlitique porphyrique', image: '/images/rocks/dacite.jpg', minerals: [
    { name: 'plagioclase', percent: '45%' }, { name: 'quartz', percent: '20%' }, { name: 'biotite', percent: '15%' }, { name: 'amphibole', percent: '12%' }, { name: 'magnetite', percent: '8%' }
  ]},
  phonolite: { type: 'magmatique', origin: 'volcanique', facies: 'Phonolite', texture: 'Microlitique fluidale', image: '/images/rocks/phonolite.jpg', minerals: [
    { name: 'feldspath', percent: '50%' }, { name: 'plagioclase', percent: '25%' }, { name: 'pyroxene', percent: '15%' }, { name: 'amphibole', percent: '10%' }
  ]},
  trachyte: { type: 'magmatique', origin: 'volcanique', facies: 'Trachyte alcalin', texture: 'Microlitique fluidale', image: '/images/rocks/trachyte.jpg', minerals: [
    { name: 'feldspath', percent: '60%' }, { name: 'plagioclase', percent: '15%' }, { name: 'biotite', percent: '10%' }, { name: 'pyroxene', percent: '10%' }, { name: 'magnetite', percent: '5%' }
  ]},
  spilite: { type: 'magmatique', origin: 'volcanique', facies: 'Spilite (basalte altere)', texture: 'Microlitique', image: '/images/rocks/spilite.jpg', minerals: [
    { name: 'plagioclase', percent: '50%' }, { name: 'chlorite', percent: '25%' }, { name: 'calcite', percent: '15%' }, { name: 'magnetite', percent: '10%' }
  ]},
  ophite: { type: 'magmatique', origin: 'subvolcanique', facies: 'Ophite (dolerite)', texture: 'Ophitique, grain moyen', image: '/images/rocks/ophite.jpg', minerals: [
    { name: 'plagioclase', percent: '50%' }, { name: 'pyroxene', percent: '35%' }, { name: 'olivine', percent: '10%' }, { name: 'magnetite', percent: '5%' }
  ]},
  tuf: { type: 'magmatique', origin: 'volcanique', facies: 'Tuf volcanique', texture: 'Pyroclastique', image: '/images/rocks/tuf.jpg', minerals: [
    { name: 'plagioclase', percent: '30%' }, { name: 'quartz', percent: '20%' }, { name: 'feldspath', percent: '20%' }, { name: 'mica', percent: '10%' }
  ]},
  cinerite: { type: 'magmatique', origin: 'volcanique', facies: 'Cinerite (tuf cendre)', texture: 'Pyroclastique fine', image: '/images/rocks/cinerite.jpg', minerals: [
    { name: 'plagioclase', percent: '30%' }, { name: 'quartz', percent: '25%' }, { name: 'feldspath', percent: '20%' }, { name: 'mica', percent: '10%' }
  ]},

  // Sedimentaires carbonatees
  calcaire: { type: 'sedimentaire', origin: 'marine', facies: 'Calcaire bioclastique a micritique', texture: 'Micritique a sparitique', image: '/images/rocks/calcaire.jpg', minerals: [
    { name: 'calcite', percent: '95%' }, { name: 'quartz', percent: '3%' }, { name: 'argile', percent: '2%' }
  ]},
  craie: { type: 'sedimentaire', origin: 'marine', facies: 'Craie a silex', texture: 'Crayeuse, tres fine', image: '/images/rocks/craie.jpg', minerals: [
    { name: 'calcite', percent: '97%' }, { name: 'silice', percent: '3%' }
  ]},
  marne: { type: 'sedimentaire', origin: 'marine', facies: 'Marne argilo-calcaire', texture: 'Massive, tendre', image: '/images/rocks/marne.jpg', minerals: [
    { name: 'calcite', percent: '60%' }, { name: 'argile', percent: '35%' }, { name: 'quartz', percent: '5%' }
  ]},
  dolomie: { type: 'sedimentaire', origin: 'marine', facies: 'Dolomie cristalline', texture: 'Saccharoide a massive', image: '/images/rocks/dolomie.jpg', minerals: [
    { name: 'dolomite', percent: '90%' }, { name: 'calcite', percent: '8%' }, { name: 'quartz', percent: '2%' }
  ]},
  travertin: { type: 'sedimentaire', origin: 'continentale', facies: 'Travertin (tuf calcaire)', texture: 'Poreuse, vacuolaire', image: '/images/rocks/travertin.jpg', minerals: [
    { name: 'calcite', percent: '95%' }, { name: 'quartz', percent: '3%' }, { name: 'argile', percent: '2%' }
  ]},
  lumachelle: { type: 'sedimentaire', origin: 'marine', facies: 'Lumachelle coquilliere', texture: 'Bioclastique grossiere', image: '/images/rocks/lumachelle.jpg', minerals: [
    { name: 'calcite', percent: '90%' }, { name: 'quartz', percent: '5%' }, { name: 'argile', percent: '5%' }
  ]},
  oolite: { type: 'sedimentaire', origin: 'marine', facies: 'Calcaire oolithique', texture: 'Oolithique', image: '/images/rocks/oolite.jpg', minerals: [
    { name: 'calcite', percent: '95%' }, { name: 'quartz', percent: '3%' }, { name: 'argile', percent: '2%' }
  ]},
  falun: { type: 'sedimentaire', origin: 'marine', facies: 'Falun coquillier', texture: 'Bioclastique meuble', image: '/images/rocks/falun.jpg', minerals: [
    { name: 'calcite', percent: '80%' }, { name: 'quartz', percent: '15%' }, { name: 'argile', percent: '5%' }
  ]},

  // Sedimentaires detritiques
  gres: { type: 'sedimentaire', origin: 'detritique', facies: 'Gres quartzeux', texture: 'Granulaire, cimentee', image: '/images/rocks/gres.jpg', minerals: [
    { name: 'quartz', percent: '75%' }, { name: 'feldspath', percent: '15%' }, { name: 'mica', percent: '5%' }, { name: 'argile', percent: '5%' }
  ]},
  argile: { type: 'sedimentaire', origin: 'detritique', facies: 'Argile plastique', texture: 'Massive, plastique', image: '/images/rocks/argile.jpg', minerals: [
    { name: 'kaolin', percent: '60%' }, { name: 'quartz', percent: '25%' }, { name: 'mica', percent: '15%' }
  ]},
  sable: { type: 'meuble', origin: 'detritique', facies: 'Sable quartzeux', texture: 'Granulaire meuble', image: '/images/rocks/sable.jpg', minerals: [
    { name: 'quartz', percent: '80%' }, { name: 'feldspath', percent: '10%' }, { name: 'mica', percent: '5%' }
  ]},
  silex: { type: 'sedimentaire', origin: 'diagenetique', facies: 'Silex nodulaire', texture: 'Cryptocristalline', image: '/images/rocks/silex.jpg', minerals: [
    { name: 'silice', percent: '98%' }, { name: 'calcite', percent: '2%' }
  ]},
  conglomerat: { type: 'sedimentaire', origin: 'detritique', facies: 'Conglomerat polygynique', texture: 'Grossiere, cimentee', image: '/images/rocks/conglomerat.jpg', minerals: [
    { name: 'quartz', percent: '50%' }, { name: 'feldspath', percent: '20%' }, { name: 'calcite', percent: '15%' }, { name: 'argile', percent: '15%' }
  ]},
  poudingue: { type: 'sedimentaire', origin: 'detritique', facies: 'Poudingue a galets arrondis', texture: 'Grossiere, cimentee', image: '/images/rocks/poudingue.jpg', minerals: [
    { name: 'quartz', percent: '55%' }, { name: 'calcite', percent: '20%' }, { name: 'feldspath', percent: '15%' }, { name: 'argile', percent: '10%' }
  ]},
  arkose: { type: 'sedimentaire', origin: 'detritique', facies: 'Arkose feldspathique', texture: 'Granulaire, cimentee', image: '/images/rocks/arkose.jpg', minerals: [
    { name: 'quartz', percent: '50%' }, { name: 'feldspath', percent: '35%' }, { name: 'mica', percent: '10%' }, { name: 'argile', percent: '5%' }
  ]},
  siltite: { type: 'sedimentaire', origin: 'detritique', facies: 'Siltite', texture: 'Fine, laminee', image: '/images/rocks/siltite.jpg', minerals: [
    { name: 'quartz', percent: '50%' }, { name: 'argile', percent: '30%' }, { name: 'mica', percent: '15%' }, { name: 'feldspath', percent: '5%' }
  ]},
  argilite: { type: 'sedimentaire', origin: 'detritique', facies: 'Argilite induree', texture: 'Massive, compacte', image: '/images/rocks/argilite.jpg', minerals: [
    { name: 'kaolin', percent: '65%' }, { name: 'quartz', percent: '20%' }, { name: 'mica', percent: '10%' }, { name: 'chlorite', percent: '5%' }
  ]},
  grauwacke: { type: 'sedimentaire', origin: 'detritique', facies: 'Grauwacke', texture: 'Granulaire, mal triee', image: '/images/rocks/grauwacke.jpg', minerals: [
    { name: 'quartz', percent: '35%' }, { name: 'feldspath', percent: '25%' }, { name: 'argile', percent: '20%' }, { name: 'mica', percent: '10%' }, { name: 'chlorite', percent: '10%' }
  ]},
  gaize: { type: 'sedimentaire', origin: 'marine', facies: 'Gaize siliceuse', texture: 'Fine, poreuse', image: '/images/rocks/gaize.jpg', minerals: [
    { name: 'silice', percent: '70%' }, { name: 'argile', percent: '20%' }, { name: 'glauconie', percent: '10%' }
  ]},
  meuliere: { type: 'sedimentaire', origin: 'continentale', facies: 'Meuliere', texture: 'Caverneuse, silicifiee', image: '/images/rocks/meuliere.jpg', minerals: [
    { name: 'silice', percent: '85%' }, { name: 'calcite', percent: '10%' }, { name: 'argile', percent: '5%' }
  ]},
  radiolarite: { type: 'sedimentaire', origin: 'marine', facies: 'Radiolarite', texture: 'Cryptocristalline', image: '/images/rocks/radiolarite.jpg', minerals: [
    { name: 'silice', percent: '90%' }, { name: 'argile', percent: '8%' }, { name: 'hematite', percent: '2%' }
  ]},
  breche: { type: 'sedimentaire', origin: 'detritique', facies: 'Breche a elements anguleux', texture: 'Grossiere, anguleuse', image: '/images/rocks/breche.jpg', minerals: [
    { name: 'quartz', percent: '40%' }, { name: 'calcite', percent: '30%' }, { name: 'feldspath', percent: '15%' }, { name: 'argile', percent: '15%' }
  ]},
  tillite: { type: 'sedimentaire', origin: 'glaciaire', facies: 'Tillite (moraine fossile)', texture: 'Heterogene, non triee', image: '/images/rocks/tillite.jpg', minerals: [
    { name: 'quartz', percent: '40%' }, { name: 'feldspath', percent: '25%' }, { name: 'argile', percent: '20%' }, { name: 'mica', percent: '15%' }
  ]},

  // Meubles
  loess: { type: 'meuble', origin: 'eolienne', facies: 'Loess calcaire', texture: 'Silteuse, homogene', image: '/images/rocks/loess.jpg', minerals: [
    { name: 'quartz', percent: '50%' }, { name: 'calcite', percent: '20%' }, { name: 'feldspath', percent: '15%' }, { name: 'argile', percent: '15%' }
  ]},
  limon: { type: 'meuble', origin: 'fluviatile', facies: 'Limon argileux', texture: 'Fine, plastique', image: '/images/rocks/limon.jpg', minerals: [
    { name: 'quartz', percent: '40%' }, { name: 'argile', percent: '35%' }, { name: 'calcite', percent: '15%' }, { name: 'mica', percent: '10%' }
  ]},
  alluvion: { type: 'meuble', origin: 'fluviatile', facies: 'Alluvions fluviatiles', texture: 'Variable, stratifiee', image: '/images/rocks/alluvion.jpg', minerals: [
    { name: 'quartz', percent: '55%' }, { name: 'feldspath', percent: '15%' }, { name: 'calcite', percent: '15%' }, { name: 'argile', percent: '15%' }
  ]},
  colluvion: { type: 'meuble', origin: 'gravitaire', facies: 'Colluvions de pente', texture: 'Heterogene', image: '/images/rocks/colluvion.jpg', imageStatus: 'quarantined', minerals: [
    { name: 'quartz', percent: '40%' }, { name: 'argile', percent: '30%' }, { name: 'calcite', percent: '15%' }, { name: 'feldspath', percent: '15%' }
  ]},
  greze: { type: 'meuble', origin: 'periglaciaire', facies: 'Greze litee', texture: 'Stratifiee, anguleuse', image: '/images/rocks/greze.jpg', minerals: [
    { name: 'calcite', percent: '70%' }, { name: 'quartz', percent: '15%' }, { name: 'argile', percent: '15%' }
  ]},
  tourbe: { type: 'meuble', origin: 'organique', facies: 'Tourbe', texture: 'Fibreuse a amorphe', image: '/images/rocks/tourbe.jpg', minerals: [
    { name: 'lignite', percent: '85%' }, { name: 'quartz', percent: '10%' }, { name: 'argile', percent: '5%' }
  ]},
  tangue: { type: 'meuble', origin: 'marine', facies: 'Tangue (vase calcaire)', texture: 'Fine, plastique', image: '/images/rocks/tangue.jpg', minerals: [
    { name: 'calcite', percent: '50%' }, { name: 'argile', percent: '30%' }, { name: 'quartz', percent: '20%' }
  ]},
  alterite: { type: 'meuble', origin: 'residuelle', facies: 'Alterite', texture: 'Variable, meuble', image: '/images/rocks/alterite.jpg', minerals: [
    { name: 'kaolin', percent: '40%' }, { name: 'quartz', percent: '35%' }, { name: 'limonite', percent: '15%' }, { name: 'mica', percent: '10%' }
  ]},

  // Metamorphiques
  schiste: { type: 'metamorphique', origin: 'regional', facies: 'Schiste pelitique', texture: 'Schisteuse, feuilletee', image: '/images/rocks/schiste.jpg', minerals: [
    { name: 'quartz', percent: '40%' }, { name: 'mica', percent: '30%' }, { name: 'chlorite', percent: '20%' }, { name: 'feldspath', percent: '10%' }
  ]},
  gneiss: { type: 'metamorphique', origin: 'regional', facies: 'Gneiss oeille', texture: 'Gneissique, rubanee', image: '/images/rocks/gneiss.jpg', minerals: [
    { name: 'feldspath', percent: '40%' }, { name: 'quartz', percent: '35%' }, { name: 'mica', percent: '20%' }, { name: 'grenat', percent: '5%' }
  ]},
  micaschiste: { type: 'metamorphique', origin: 'regional', facies: 'Micaschiste a grenat', texture: 'Schisteuse, cristalline', image: '/images/rocks/micaschiste.jpg', minerals: [
    { name: 'mica', percent: '40%' }, { name: 'quartz', percent: '35%' }, { name: 'grenat', percent: '10%' }, { name: 'staurotide', percent: '8%' }, { name: 'chlorite', percent: '7%' }
  ]},
  quartzite: { type: 'metamorphique', origin: 'regional', facies: 'Quartzite massif', texture: 'Granoblastique', image: '/images/rocks/quartzite.jpg', minerals: [
    { name: 'quartz', percent: '90%' }, { name: 'mica', percent: '5%' }, { name: 'feldspath', percent: '5%' }
  ]},
  migmatite: { type: 'metamorphique', origin: 'anatexie', facies: 'Migmatite heterogene', texture: 'Migmatitique, rubanee', image: '/images/rocks/migmatite.jpg', minerals: [
    { name: 'feldspath', percent: '35%' }, { name: 'quartz', percent: '30%' }, { name: 'mica', percent: '20%' }, { name: 'grenat', percent: '8%' }, { name: 'sillimanite', percent: '7%' }
  ]},
  eclogite: { type: 'metamorphique', origin: 'haute pression', facies: 'Eclogite', texture: 'Granoblastique', image: '/images/rocks/eclogite.jpg', minerals: [
    { name: 'grenat', percent: '45%' }, { name: 'pyroxene', percent: '45%' }, { name: 'quartz', percent: '5%' }, { name: 'amphibole', percent: '5%' }
  ]},
  serpentinite: { type: 'metamorphique', origin: 'hydrothermal', facies: 'Serpentinite', texture: 'Massive a fibreuse', image: '/images/rocks/serpentinite.jpg', minerals: [
    { name: 'chlorite', percent: '60%' }, { name: 'magnetite', percent: '15%' }, { name: 'olivine', percent: '15%' }, { name: 'pyroxene', percent: '10%' }
  ]},
  mylonite: { type: 'metamorphique', origin: 'dynamique', facies: 'Mylonite', texture: 'Mylonitique, laminee', image: '/images/rocks/mylonite.jpg', minerals: [
    { name: 'quartz', percent: '40%' }, { name: 'feldspath', percent: '30%' }, { name: 'mica', percent: '20%' }, { name: 'chlorite', percent: '10%' }
  ]},
  corneenne: { type: 'metamorphique', origin: 'contact', facies: 'Corneenne', texture: 'Cornee, compacte', image: '/images/rocks/corneenne.jpg', minerals: [
    { name: 'quartz', percent: '30%' }, { name: 'feldspath', percent: '25%' }, { name: 'biotite', percent: '20%' }, { name: 'andalousite', percent: '15%' }, { name: 'cordierite', percent: '10%' }
  ]},
  phyllade: { type: 'metamorphique', origin: 'regional', facies: 'Phyllade', texture: 'Phylliteuse, satinee', image: '/images/rocks/phyllade.jpg', minerals: [
    { name: 'mica', percent: '40%' }, { name: 'quartz', percent: '35%' }, { name: 'chlorite', percent: '20%' }, { name: 'feldspath', percent: '5%' }
  ]},
  ardoise: { type: 'metamorphique', origin: 'regional', facies: 'Ardoise', texture: 'Schisteuse fine, fissile', image: '/images/rocks/ardoise.jpg', minerals: [
    { name: 'mica', percent: '40%' }, { name: 'quartz', percent: '30%' }, { name: 'chlorite', percent: '20%' }, { name: 'feldspath', percent: '10%' }
  ]},
  ampelite: { type: 'metamorphique', origin: 'regional', facies: 'Ampelite (schiste noir)', texture: 'Schisteuse, noire', image: '/images/rocks/ampelite.jpg', imageStatus: 'quarantined', minerals: [
    { name: 'quartz', percent: '30%' }, { name: 'mica', percent: '25%' }, { name: 'chlorite', percent: '20%' }, { name: 'pyrite', percent: '10%' }, { name: 'lignite', percent: '15%' }
  ]},
  phtanite: { type: 'metamorphique', origin: 'regional', facies: 'Phtanite (lydiite)', texture: 'Cryptocristalline, compacte', image: '/images/rocks/phtanite.jpg', minerals: [
    { name: 'silice', percent: '85%' }, { name: 'argile', percent: '10%' }, { name: 'pyrite', percent: '5%' }
  ]},
  pelite: { type: 'sedimentaire', origin: 'detritique', facies: 'Pelite argileuse', texture: 'Tres fine, compacte', image: '/images/rocks/pelite.jpg', minerals: [
    { name: 'argile', percent: '55%' }, { name: 'quartz', percent: '25%' }, { name: 'mica', percent: '15%' }, { name: 'chlorite', percent: '5%' }
  ]},
}

const ROCK_ACCENT_ALIASES: Record<string, string> = {
  'grès': 'gres',
  'conglomérat': 'conglomerat',
  'pélite': 'pelite',
  'meulière': 'meuliere',
  'grèze': 'greze',
  'cornéenne': 'corneenne',
  'ampélite': 'ampelite',
  'cinérite': 'cinerite',
  'andésite': 'andesite',
  'éclogite': 'eclogite',
  'brèche': 'breche',
  'altérite': 'alterite',
}

const MINERAL_BAR_COLORS: Record<string, string> = {
  feldspath: '#e57373',
  plagioclase: '#64b5f6',
  quartz: '#b0b0b0',
  biotite: '#81c784',
  muscovite: '#81c784',
  mica: '#81c784',
  amphibole: '#ba68c8',
  calcite: '#fff176',
  pyroxene: '#ffb74d',
  olivine: '#aed581',
  argile: '#a1887f',
  kaolin: '#a1887f',
  chlorite: '#4db6ac',
  dolomite: '#f0e68c',
  magnetite: '#78909c',
  silice: '#b0b0b0',
  grenat: '#ef5350',
  staurotide: '#ff8a65',
  andalousite: '#ce93d8',
  cordierite: '#90caf9',
  sillimanite: '#ce93d8',
  hematite: '#ef9a9a',
  limonite: '#bcaaa4',
  pyrite: '#ffd54f',
  glauconie: '#66bb6a',
  lignite: '#8d6e63',
  tourmaline: '#7e57c2',
}

export function getMineralBarColor(name: string): string {
  const key = name.toLowerCase()
  const canonical = ACCENT_ALIASES[key] ?? key
  return MINERAL_BAR_COLORS[canonical] ?? '#888'
}

import imageMetadata from '../../public/images/rocks/metadata.json'

export function hasUsableImage(info: RockInfo | undefined): boolean {
  return !!info?.image && info.imageStatus !== 'quarantined'
}

export function getRockInfo(name: string): RockInfo | undefined {
  const key = name.toLowerCase()
  const canonical = ROCK_ACCENT_ALIASES[key] ?? key
  const base = ROCK_DB[canonical]
  if (!base) return undefined
  const source = (imageMetadata as Record<string, ImageSource>)[canonical]
  return source ? { ...base, imageSource: source } : base
}
