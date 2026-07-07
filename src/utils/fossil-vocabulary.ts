/**
 * Fossil vocabulary shared between geology-data.ts (TypeScript) and
 * scripts/fetch-fossil-enrichment.mjs (ESM Node).
 *
 * Single source of truth for FOSSIL_GROUPS and FOSSIL_CANONICAL.
 */

export const FOSSIL_GROUPS: Record<string, readonly string[]> = {
  ammonites: [
    'ammonites', 'ammonite', 'ammonitique',
    'goniatites', 'hildoceras', 'harpoceras', 'lytoceras',
    'arnioceras', 'baculites', 'scaphites', 'orthocères', 'orthoceres',
    'cardioceras', 'nautiles', 'céphalopodes', 'cephalopodes',
  ],
  bélemnites: ['bélemnites', 'bélemnite', 'belemnites', 'belemnite'],
  échinodermes: [
    'échinodermes', 'echinodermes', 'oursins', 'oursin', 'crinoïdes', 'crinoides', 'encrines',
  ],
  échinides: [
    'échinides', 'echinides', 'échinide', 'echinide',
  ],
  brachiopodes: [
    'brachiopodes', 'brachiopode',
    'térébratules', 'terebratules', 'térébratule', 'terebratule',
    'rhynchonelles', 'rhynchonelle', 'rhynchonella', 'orthis', 'spirifer', 'athyris',
  ],
  bivalves: [
    'bivalves', 'bivalve', 'lamellibranches', 'lamellibranche', 'pélécypodes', 'pelecypodes',
    'huîtres', 'huître', 'huitres', 'huitre',
    'gryphées', 'gryphees', 'gryphée', 'gryphee', 'gryphaea', 'exogyra', 'exogyres', 'ostrea',
    'pecten', 'pectinidés', 'pectinides', 'plicatules', 'trigonies', 'trigonia',
    'inocérames', 'inocerames', 'inoceramus',
  ],
  gastéropodes: [
    'gastéropodes', 'gasteropodes', 'gastropodes',
    'cérithes', 'cerithes', 'cérithe', 'cerithe',
    'turritelles', 'turritella', 'natica', 'natices',
  ],
  rudistes: ['rudistes', 'rudiste', 'hippurites', 'toucasia', 'caprines', 'radiolites'],
  coraux: [
    'coraux', 'corail', 'coralien', 'corallien', 'récifal', 'recifal', 'polypiers',
    'stromatopores', 'stromatoporidés', 'stromatoporides', 'rugosa', 'récif', 'recif',
  ],
  foraminifères: [
    'foraminifères', 'foraminifere', 'foraminiferes', 'nummulites', 'nummulite',
    'nummulitique', 'orbitolines', 'orbitoline', 'milioles', 'miliole', 'miliolidés', 'miliolides',
    'alvéolines', 'alveolines', 'alvéoline', 'alveoline', 'lituolidés', 'lituolides',
    'orbitoïdes', 'orbitoides', 'orbitolinidés', 'orbitolinides', 'discocyclines', 'discocycline',
    'assilines', 'assiline', 'operculines', 'globigérines', 'globigerines', 'globotruncana',
    'rotalipora', 'calpionelles', 'praeglobotruncana', 'globotruncane',
  ],
  trilobites: ['trilobites', 'trilobite', 'paradoxides'],
  vertébrés: [
    'poissons', 'poisson', 'reptiles', 'reptile', 'dinosaures', 'dinosaure',
    'mammifères', 'mammifere', 'mammiferes', 'vertébrés', 'vertebre', 'vertebres',
  ],
  algues: [
    'algues', 'stromatolithes', 'characées', 'characees', 'dasycladacées', 'dasycladacees',
    'lithothamnium', 'microcodium',
  ],
  bryozoaires: ['bryozoaires', 'bryozoaire'],
  microfossiles: [
    'radiolaires', 'ostracodes', 'conodontes', 'graptolites',
    'chitinozoaires', 'acritarches', 'dinoflagellés', 'dinoflagelles',
    'spores', 'pollen', 'tentaculites', 'microflore',
  ],
  annélides: ['annélides', 'annelides', 'serpules', 'terriers'],
  autres: [
    'éponges', 'eponges', 'spongiaires',
    'microfaune',
    'empreintes', 'encroûtements', 'encroutements',
    'oncolites', 'oncolithes', 'oncoïdes', 'oncoides',
  ],
}

export const FOSSIL_CANONICAL: Record<string, string> = {
  // ammonites
  ammonites: 'ammonite', ammonite: 'ammonite', ammonitique: 'ammonite',
  goniatites: 'goniatite', goniatite: 'goniatite',
  hildoceras: 'hildoceras', harpoceras: 'harpoceras', lytoceras: 'lytoceras',
  arnioceras: 'arnioceras', baculites: 'baculite', scaphites: 'scaphite',
  'orthocères': 'orthocère', orthoceres: 'orthocère',
  cardioceras: 'cardioceras',
  nautiles: 'nautile', nautile: 'nautile',
  'céphalopodes': 'céphalopode', cephalopodes: 'céphalopode',
  // belemnites
  'bélemnites': 'bélemnite', 'bélemnite': 'bélemnite', belemnites: 'bélemnite', belemnite: 'bélemnite',
  // echinoderms
  'échinodermes': 'échinoderme', echinodermes: 'échinoderme',
  oursins: 'oursin', oursin: 'oursin',
  'crinoïdes': 'crinoïde', crinoides: 'crinoïde', encrines: 'encrine',
  // echinoids
  'échinides': 'échinide', echinides: 'échinide',
  'échinide': 'échinide', echinide: 'échinide',
  // brachiopods
  brachiopodes: 'brachiopode', brachiopode: 'brachiopode',
  'térébratules': 'térébratule', terebratules: 'térébratule',
  'térébratule': 'térébratule', terebratule: 'térébratule',
  rhynchonelles: 'rhynchonelle', rhynchonelle: 'rhynchonelle', rhynchonella: 'rhynchonella',
  orthis: 'orthis', spirifer: 'spirifer', athyris: 'athyris',
  // bivalves
  bivalves: 'bivalve', bivalve: 'bivalve',
  lamellibranches: 'lamellibranche', lamellibranche: 'lamellibranche',
  'pélécypodes': 'pélécypode', pelecypodes: 'pélécypode',
  'huîtres': 'huître', 'huître': 'huître', huitres: 'huître', huitre: 'huître',
  'gryphées': 'gryphée', gryphees: 'gryphée', 'gryphée': 'gryphée', gryphee: 'gryphée',
  gryphaea: 'gryphaea', exogyra: 'exogyra', exogyres: 'exogyre', ostrea: 'ostrea',
  pecten: 'pecten',
  'pectinidés': 'pectinidé', pectinides: 'pectinidé',
  plicatules: 'plicatule',
  trigonies: 'trigonie', trigonia: 'trigonia',
  'inocérames': 'inocérame', inocerames: 'inocérame', inoceramus: 'inoceramus',
  // gastropods
  'gastéropodes': 'gastéropode', gasteropodes: 'gastéropode', gastropodes: 'gastéropode',
  'cérithes': 'cérithe', cerithes: 'cérithe', 'cérithe': 'cérithe', cerithe: 'cérithe',
  turritelles: 'turritelle', turritella: 'turritella',
  natica: 'natica', natices: 'natice',
  // rudists
  rudistes: 'rudiste', rudiste: 'rudiste', hippurites: 'hippurite',
  toucasia: 'toucasia', caprines: 'caprine', radiolites: 'radiolite',
  // corals
  coraux: 'corail', corail: 'corail', coralien: 'corail', corallien: 'corail',
  'récifal': 'récifal', recifal: 'récifal',
  polypiers: 'polypier',
  stromatopores: 'stromatopore',
  'stromatoporidés': 'stromatoporidé', stromatoporides: 'stromatoporidé',
  rugosa: 'rugosa',
  'récif': 'récif', recif: 'récif',
  // foraminifera
  'foraminifères': 'foraminifère', foraminifere: 'foraminifère', foraminiferes: 'foraminifère',
  nummulites: 'nummulite', nummulite: 'nummulite', nummulitique: 'nummulite',
  orbitolines: 'orbitoline', orbitoline: 'orbitoline',
  milioles: 'miliole', miliole: 'miliole',
  'miliolidés': 'miliolidé', miliolides: 'miliolidé',
  'alvéolines': 'alvéoline', alveolines: 'alvéoline', 'alvéoline': 'alvéoline', alveoline: 'alvéoline',
  'lituolidés': 'lituolidé', lituolides: 'lituolidé',
  'orbitoïdes': 'orbitoïde', orbitoides: 'orbitoïde',
  'orbitolinidés': 'orbitolinidé', orbitolinides: 'orbitolinidé',
  discocyclines: 'discocycline', discocycline: 'discocycline',
  assilines: 'assiline', assiline: 'assiline', operculines: 'operculine',
  'globigérines': 'globigérine', globigerines: 'globigérine',
  globotruncana: 'globotruncana', rotalipora: 'rotalipora', calpionelles: 'calpionelle',
  praeglobotruncana: 'praeglobotruncana', globotruncane: 'globotruncane',
  // trilobites
  trilobites: 'trilobite', trilobite: 'trilobite', paradoxides: 'paradoxides',
  // vertebrates
  poissons: 'poisson', poisson: 'poisson',
  reptiles: 'reptile', reptile: 'reptile',
  dinosaures: 'dinosaure', dinosaure: 'dinosaure',
  'mammifères': 'mammifère', mammifere: 'mammifère', mammiferes: 'mammifère',
  'vertébrés': 'vertébré', vertebre: 'vertébré', vertebres: 'vertébré',
  // algae
  algues: 'algue', stromatolithes: 'stromatolithe',
  'characées': 'characée', characees: 'characée',
  'dasycladacées': 'dasycladacée', dasycladacees: 'dasycladacée',
  lithothamnium: 'lithothamnium', microcodium: 'microcodium',
  // bryozoans
  bryozoaires: 'bryozoaire', bryozoaire: 'bryozoaire',
  // microfossils
  radiolaires: 'radiolaire', ostracodes: 'ostracode', conodontes: 'conodonte',
  graptolites: 'graptolite',
  chitinozoaires: 'chitinozoaire', acritarches: 'acritarche',
  'dinoflagellés': 'dinoflagellé', dinoflagelles: 'dinoflagellé',
  spores: 'spore', pollen: 'pollen', tentaculites: 'tentaculite', microflore: 'microflore',
  // annelids
  'annélides': 'annélide', annelides: 'annélide', serpules: 'serpule', terriers: 'terrier',
  // other
  'éponges': 'éponge', eponges: 'éponge', spongiaires: 'spongiaire',
  // 'fossile'/'fossilifère' removed: generic terms, never in FOSSIL_GROUPS,
  // they produce no useful tag and pollute the "other" category.
  bioclastes: 'bioclaste', bioclaste: 'bioclaste', microfaune: 'microfaune',
  empreintes: 'empreinte',
  'encroûtements': 'encroûtement', encroutements: 'encroûtement',
  oncolites: 'oncolite', oncolithes: 'oncolite', 'oncoïdes': 'oncoïde', oncoides: 'oncoïde',
}
