// ICS (International Chronostratigraphic Chart) classification for BD Charm-50 NOTATION codes

export interface GeologyEntry {
  ere: string
  periode: string
  systeme: string
  etage: string
  color: string
}

const FALLBACK: GeologyEntry = {
  ere: '',
  periode: 'Indetermine',
  systeme: '',
  etage: '',
  color: '#CCCCCC'
}

// Prefix rules ordered longest-first for correct matching
const PREFIX_RULES: ReadonlyArray<{ prefixes: readonly string[]; entry: GeologyEntry }> = [
  // Composite / transition notations (longest first)
  { prefixes: ['LMz-T', 'LMz'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: '', color: '#34B2E8' } },
  { prefixes: ['MzM'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0' } },
  { prefixes: ['MzS'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0' } },
  { prefixes: ['MzR'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0' } },
  { prefixes: ['Mz'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0' } },
  { prefixes: ['TLB'], entry: { ere: 'Mesozoique', periode: 'Trias-Lias', systeme: '', etage: '', color: '#812B92' } },
  { prefixes: ['Lã1', 'Lã5', 'Lã'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: '', color: '#34B2E8' } },

  // Miocene uppercase subdivisions
  { prefixes: ['Mp-u', 'Mp'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene moy.-sup.', etage: '', color: '#FFFF00' } },
  { prefixes: ['Mu'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene sup.', etage: '', color: '#FFFF00' } },
  { prefixes: ['Mv'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene moy.', etage: '', color: '#FFFF00' } },
  { prefixes: ['Mx'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene inf.', etage: '', color: '#FFFF00' } },
  { prefixes: ['M'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene', etage: '', color: '#FFFF00' } },

  // Quaternaire uppercase
  { prefixes: ['Q'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },

  // Cretace inf. subdivisions (n2, n4)
  { prefixes: ['n4'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Barremien', color: '#7ECD74' } },
  { prefixes: ['n2'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Valanginien', color: '#7ECD74' } },

  // Alterites / weathering
  { prefixes: ['a1'], entry: { ere: '', periode: 'Alterites', systeme: '', etage: '', color: '#E8D0A0' } },
  { prefixes: ['aã'], entry: { ere: '', periode: 'Roches cristallines', systeme: '', etage: '', color: '#E36DAA' } },

  // Eocene subdivisions (longest prefixes first)
  { prefixes: ['e7'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene sup.', etage: 'Priabonien', color: '#FDB46C' } },
  { prefixes: ['e6'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene moy.', etage: 'Bartonien', color: '#FDB46C' } },
  { prefixes: ['e5'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene moy.', etage: 'Lutetien', color: '#FDB46C' } },
  { prefixes: ['e3', 'e4'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene inf.', etage: 'Ypresien', color: '#FDB46C' } },
  { prefixes: ['e1', 'e2'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene', etage: '', color: '#FDB46C' } },

  // Cretace superieur
  { prefixes: ['c6'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Maastrichtien', color: '#BFE48A' } },
  { prefixes: ['c5'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Campanien', color: '#E2F2B0' } },
  { prefixes: ['c4'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Santonien', color: '#E2F2B0' } },
  { prefixes: ['c3'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Coniacien', color: '#BFE48A' } },
  { prefixes: ['c2'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Turonien', color: '#A6D468' } },
  { prefixes: ['c1'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Cenomanien', color: '#A6D468' } },

  // Cretace inferieur
  { prefixes: ['n6'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Albien', color: '#7ECD74' } },
  { prefixes: ['n5'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Aptien', color: '#7ECD74' } },

  // Jurassique superieur
  { prefixes: ['j7'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. sup.', etage: 'Tithonien', color: '#B3D4FF' } },
  { prefixes: ['j6'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. sup.', etage: 'Kimmeridgien', color: '#B3D4FF' } },
  { prefixes: ['j5'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. sup.', etage: 'Oxfordien', color: '#B3D4FF' } },

  // Jurassique moyen
  { prefixes: ['j4'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. moy.', etage: 'Callovien', color: '#80CFFF' } },
  { prefixes: ['j3'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. moy.', etage: 'Bajocien', color: '#80CFFF' } },

  // Jurassique inferieur
  { prefixes: ['j2'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf.', etage: 'Sinemurien', color: '#34B2E8' } },
  { prefixes: ['j1'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf.', etage: 'Hettangien', color: '#34B2E8' } },

  // Lias
  { prefixes: ['l4'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Toarcien', color: '#34B2E8' } },
  { prefixes: ['l3'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Pliensbachien', color: '#34B2E8' } },
  { prefixes: ['l2'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Sinemurien', color: '#34B2E8' } },
  { prefixes: ['l1'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Hettangien', color: '#34B2E8' } },

  // Quaternaire (multi-prefix)
  { prefixes: ['Hydro', 'GLB'], entry: { ere: '', periode: 'Domaine marin/hydro', systeme: '', etage: '', color: '#C8E8FF' } },
  { prefixes: ['SGH'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['SL', 'VL'], entry: { ere: '', periode: 'Domaine marin/hydro', systeme: '', etage: '', color: '#C8E8FF' } },
  { prefixes: ['SC'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['CF'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['LP'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['OE'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['Tz'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['Fz', 'Fy', 'Fx', 'Fw', 'Fv', 'Fu'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['B-'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: 'Formations superficielles', etage: '', color: '#F9F97F' } },

  // Single-char: Eocene generic, must come after e1-e7
  { prefixes: ['e'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene', etage: '', color: '#FDB46C' } },

  // Cretace generic (after c1-c6)
  { prefixes: ['c'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: '', etage: '', color: '#A6D468' } },

  // Jurassique / Lias generic (after j1-j7, l1-l4)
  { prefixes: ['j', 'l'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: '', etage: '', color: '#34B2E8' } },

  // Other periods
  { prefixes: ['p'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Pliocene', etage: '', color: '#FFFF99' } },
  { prefixes: ['m'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene', etage: '', color: '#FFFF00' } },
  { prefixes: ['g'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Oligocene', etage: '', color: '#FDC07A' } },
  { prefixes: ['t'], entry: { ere: 'Mesozoique', periode: 'Trias', systeme: '', etage: '', color: '#812B92' } },
  { prefixes: ['r'], entry: { ere: 'Paleozoique', periode: 'Permien', systeme: '', etage: '', color: '#F04028' } },
  { prefixes: ['h'], entry: { ere: 'Paleozoique', periode: 'Carbonifere', systeme: '', etage: '', color: '#67A599' } },
  { prefixes: ['d'], entry: { ere: 'Paleozoique', periode: 'Devonien', systeme: '', etage: '', color: '#CB8C37' } },
  { prefixes: ['s'], entry: { ere: 'Paleozoique', periode: 'Silurien', systeme: '', etage: '', color: '#B3E1B6' } },
  { prefixes: ['o'], entry: { ere: 'Paleozoique', periode: 'Ordovicien', systeme: '', etage: '', color: '#009270' } },
  { prefixes: ['k'], entry: { ere: 'Paleozoique', periode: 'Cambrien', systeme: '', etage: '', color: '#7FA08C' } },
  { prefixes: ['b'], entry: { ere: 'Precambrien', periode: 'Brioverien', systeme: '', etage: '', color: '#F4B8D4' } },

  // Roches cristallines
  { prefixes: ['Èæ', 'ã', 'î', 'ó', 'Ã', 'Õ', 'ñ', 'Å', 'Û', '¥', 'Ê', 'ï', 'â'], entry: { ere: '', periode: 'Roches cristallines', systeme: '', etage: '', color: '#E36DAA' } },

  // Quaternaire catch-all (single chars)
  { prefixes: ['q', 'F', 'C', 'D', 'E', 'K', 'S', 'U', 'X', 'R'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },
  { prefixes: ['°', '³'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F' } },

  // Alterites
  { prefixes: ['¡'], entry: { ere: '', periode: 'Alterites', systeme: '', etage: '', color: '#E8D0A0' } },
]

// Build a flat sorted list: longest prefix first for greedy matching
const SORTED_RULES: ReadonlyArray<{ prefix: string; entry: GeologyEntry }> = PREFIX_RULES
  .flatMap(rule => rule.prefixes.map(prefix => ({ prefix, entry: rule.entry })))
  .sort((a, b) => b.prefix.length - a.prefix.length)

export function classifyNotation(notation: string): GeologyEntry {
  if (!notation) return FALLBACK

  // Normalize: extract content from parentheses, e.g. "(b2-r)LM" → "b2-r"
  let normalized = notation
  const parenMatch = notation.match(/^\(([^)]+)\)/)
  if (parenMatch) {
    normalized = parenMatch[1]
  }
  // For ranges like "b2-r", keep first part "b2" for prefix matching
  const rangePart = normalized.split('-')[0]
  const candidates = rangePart !== normalized ? [rangePart, normalized] : [normalized]

  for (const candidate of candidates) {
    for (const rule of SORTED_RULES) {
      if (candidate.startsWith(rule.prefix)) {
        return rule.entry
      }
    }
  }
  return FALLBACK
}

// Helpers: extract terms from description text (case-insensitive)

const MINERALS = [
  'quartz', 'feldspath', 'biotite', 'muscovite', 'cordierite', 'cordiérite',
  'amphibole', 'pyroxène', 'pyroxene', 'olivine', 'grenat', 'tourmaline',
  'chlorite', 'calcite', 'dolomite', 'glauconie', 'silice', 'pyrite',
  'mica', 'plagioclase', 'orthose', 'staurotide', 'staurolite',
  'andalousite', 'sillimanite', 'disthène', 'disthene', 'apatite',
  'zircon', 'magnétite', 'magnetite', 'ilménite', 'ilmenite',
  'hématite', 'hematite', 'limonite', 'sidérite', 'siderite', 'barytine',
  'fer', 'kaolin', 'phosphate', 'gypse', 'anhydrite', 'fluorine',
  'galène', 'galene', 'blende', 'majorite', 'lignite', 'blavierite'
]

const FOSSILS = [
  'bryozoaires', 'ammonites', 'brachiopodes', 'trilobites', 'crinoïdes',
  'crinoides', 'coraux', 'récif', 'recif', 'rudistes', 'foraminifères',
  'foraminiferes', 'nummulites', 'ostracodes', 'graptolites', 'bivalves',
  'gastropodes', 'gastéropodes', 'gasteropodes', 'échinodermes', 'echinodermes',
  'spongiaires', 'éponges', 'eponges', 'lamellibranches', 'bélemnites',
  'belemnites', 'inocérames', 'inocerames', 'orbitolines', 'nautiles',
  'algues', 'stromatolithes', 'polypiers', 'céphalopodes', 'cephalopodes',
  'pélécypodes', 'pelecypodes', 'conodontes', 'chitinozoaires',
  'acritarches', 'dinoflagellés', 'dinoflagelles', 'spores', 'pollen'
]

const LITHOLOGY = [
  'calcaire', 'craie', 'marne', 'grès', 'gres', 'argile', 'schiste',
  'gneiss', 'granite', 'basalte', 'sable', 'silex', 'conglomérat',
  'conglomerat', 'dolomie', 'gaize', 'falun',
  'siltite', 'argilite', 'grauwacke', 'loess', 'limon', 'tuf',
  'travertin', 'quartzite', 'pelite', 'pélite', 'meulière', 'meuliere',
  'lumachelle', 'oolite', 'tangue', 'tourbe', 'alluvion', 'colluvion',
  'grèze', 'greze', 'cornéenne', 'corneenne', 'granodiorite',
  'ampélite', 'ampelite', 'diorite', 'micaschiste', 'migmatite',
  'phtanite', 'radiolarite', 'poudingue', 'cinérite', 'cinerite',
  'rhyolite', 'andésite', 'andesite', 'dacite', 'phonolite', 'trachyte',
  'spilite', 'ophite', 'serpentinite', 'éclogite', 'eclogite',
  'mylonite', 'brèche', 'breche', 'phyllade', 'ardoise',
  'alterite', 'altérite', 'tonalite', 'arkose', 'leucogranite',
  'tillite', 'trondhjemite', 'microgranite'
]

function extractTerms(text: string, terms: readonly string[]): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const term of terms) {
    if (lower.includes(term) && !found.includes(term)) {
      found.push(term)
    }
  }
  return found
}

export function extractMinerals(descr: string): string[] {
  return extractTerms(descr, MINERALS)
}

export function extractFossils(descr: string): string[] {
  return extractTerms(descr, FOSSILS)
}

export function extractLithology(descr: string): string[] {
  return extractTerms(descr, LITHOLOGY)
}
