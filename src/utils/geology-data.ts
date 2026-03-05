// ICS (International Chronostratigraphic Chart) classification for BD Charm-50 NOTATION codes

export interface GeologyEntry {
  ere: string
  periode: string
  systeme: string
  etage: string
  color: string
  ageStartMa?: number
  ageEndMa?: number
  wikiSlug?: string
  summary?: string
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
  { prefixes: ['LMz-T', 'LMz'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: '', color: '#34B2E8', ageStartMa: 201.4, ageEndMa: 174.7, wikiSlug: 'Lias_(stratigraphie)', summary: 'Lias, base du Jurassique. Marnes, calcaires argileux et schistes bitumineux deposes en milieu marin peu profond.' } },
  { prefixes: ['MzM'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0', ageStartMa: 251.9, ageEndMa: 66.0, wikiSlug: 'Mésozoïque', summary: 'Ere Mesozoique (251-66 Ma). Roches metamorphiques d\'age mesozoique.' } },
  { prefixes: ['MzS'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0', ageStartMa: 251.9, ageEndMa: 66.0, wikiSlug: 'Mésozoïque', summary: 'Ere Mesozoique (251-66 Ma). Roches sedimentaires d\'age mesozoique indifferencie.' } },
  { prefixes: ['MzR'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0', ageStartMa: 251.9, ageEndMa: 66.0, wikiSlug: 'Mésozoïque', summary: 'Ere Mesozoique (251-66 Ma). Roches magmatiques d\'age mesozoique.' } },
  { prefixes: ['Mz'], entry: { ere: 'Mesozoique', periode: '', systeme: '', etage: '', color: '#67C5B0', ageStartMa: 251.9, ageEndMa: 66.0, wikiSlug: 'Mésozoïque', summary: 'Ere Mesozoique (251-66 Ma). Terrains mesozoiques indifferencies.' } },
  { prefixes: ['TLB'], entry: { ere: 'Mesozoique', periode: 'Trias-Lias', systeme: '', etage: '', color: '#812B92', ageStartMa: 251.9, ageEndMa: 174.7, wikiSlug: 'Trias_(période)', summary: 'Transition Trias-Lias. Formations de la limite entre Trias superieur et Jurassique inferieur.' } },
  { prefixes: ['Lã1', 'Lã5', 'Lã'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: '', color: '#34B2E8', ageStartMa: 201.4, ageEndMa: 174.7, wikiSlug: 'Lias_(stratigraphie)', summary: 'Lias, base du Jurassique. Marnes, calcaires argileux et schistes bitumineux deposes en milieu marin peu profond.' } },

  // Miocene uppercase subdivisions
  { prefixes: ['Mp-u', 'Mp'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene moy.-sup.', etage: '', color: '#FFFF00', ageStartMa: 15.99, ageEndMa: 5.33, wikiSlug: 'Miocène', summary: 'Miocene moyen a superieur. Periode de rechauffement climatique avec depot de calcaires lacustres, molasses et sables.' } },
  { prefixes: ['Mu'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene sup.', etage: '', color: '#FFFF00', ageStartMa: 11.63, ageEndMa: 5.33, wikiSlug: 'Miocène_supérieur', summary: 'Miocene superieur (Tortonien-Messinien). Regression marine et debut de la crise de salinite messinienne en Mediterranee.' } },
  { prefixes: ['Mv'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene moy.', etage: '', color: '#FFFF00', ageStartMa: 15.99, ageEndMa: 11.63, wikiSlug: 'Miocène_moyen', summary: 'Miocene moyen (Langhien-Serravallien). Optimum climatique du Miocene avec faunes marines diversifiees.' } },
  { prefixes: ['Mx'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene inf.', etage: '', color: '#FFFF00', ageStartMa: 23.03, ageEndMa: 15.99, wikiSlug: 'Miocène_inférieur', summary: 'Miocene inferieur (Aquitanien-Burdigalien). Transgression marine et depot de faluns riches en mollusques.' } },
  { prefixes: ['M'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene', etage: '', color: '#FFFF00', ageStartMa: 23.03, ageEndMa: 5.33, wikiSlug: 'Miocène', summary: 'Miocene (23-5 Ma). Epoque de diversification des mammiferes et de formation des chaines alpines.' } },

  // Quaternaire uppercase
  { prefixes: ['Q'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire (2.58 Ma - actuel). Alternance de periodes glaciaires et interglaciaires, formations superficielles et alluviales.' } },

  // Cretace inf. subdivisions (n2, n4)
  { prefixes: ['n4'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Barremien', color: '#7ECD74', ageStartMa: 125.77, ageEndMa: 121.4, wikiSlug: 'Barrémien', summary: 'Barremien. Etage du Cretace inferieur marque par des calcaires urgoniens recifaux et des marnes a ammonites.' } },
  { prefixes: ['n2'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Valanginien', color: '#7ECD74', ageStartMa: 139.8, ageEndMa: 132.6, wikiSlug: 'Valanginien', summary: 'Valanginien. Etage du Cretace inferieur avec calcaires, marnes et faunes d\'ammonites diversifiees.' } },

  // Alterites / weathering
  { prefixes: ['a1'], entry: { ere: '', periode: 'Alterites', systeme: '', etage: '', color: '#E8D0A0', summary: 'Alterites et formations residuelles. Produits d\'alteration in situ des roches sous-jacentes.' } },
  { prefixes: ['aã'], entry: { ere: '', periode: 'Roches cristallines', systeme: '', etage: '', color: '#E36DAA', summary: 'Roches cristallines alterees. Socle metamorphique ou magmatique avec alteration superficielle.' } },

  // Eocene subdivisions (longest prefixes first)
  { prefixes: ['e7'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene sup.', etage: 'Priabonien', color: '#FDB46C', ageStartMa: 37.71, ageEndMa: 33.9, wikiSlug: 'Priabonien', summary: 'Priabonien. Dernier etage de l\'Eocene, marque par un refroidissement global et le debut de la glaciation antarctique.' } },
  { prefixes: ['e6'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene moy.', etage: 'Bartonien', color: '#FDB46C', ageStartMa: 41.2, ageEndMa: 37.71, wikiSlug: 'Bartonien', summary: 'Bartonien. Etage de l\'Eocene moyen avec calcaires lacustres et gypse dans le Bassin parisien.' } },
  { prefixes: ['e5'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene moy.', etage: 'Lutetien', color: '#FDB46C', ageStartMa: 47.8, ageEndMa: 41.2, wikiSlug: 'Lutétien', summary: 'Lutetien. Etage defini a Paris (Lutece), calcaire grossier exploite comme pierre de construction.' } },
  { prefixes: ['e3', 'e4'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene inf.', etage: 'Ypresien', color: '#FDB46C', ageStartMa: 56.0, ageEndMa: 47.8, wikiSlug: 'Yprésien', summary: 'Ypresien. Eocene inferieur marque par l\'optimum thermique du Paleocene-Eocene et des argiles a lignites.' } },
  { prefixes: ['e1', 'e2'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene', etage: '', color: '#FDB46C', ageStartMa: 56.0, ageEndMa: 33.9, wikiSlug: 'Éocène', summary: 'Eocene (56-34 Ma). Epoque de climat chaud avec faunes tropicales en France et formation du calcaire de Paris.' } },

  // Cretace superieur
  { prefixes: ['c6'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Maastrichtien', color: '#BFE48A', ageStartMa: 72.17, ageEndMa: 66.0, wikiSlug: 'Maastrichtien', summary: 'Maastrichtien. Dernier etage du Cretace, termine par l\'extinction massive K-Pg. Craie et calcaires crayeux.' } },
  { prefixes: ['c5'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Campanien', color: '#E2F2B0', ageStartMa: 83.6, ageEndMa: 72.17, wikiSlug: 'Campanien', summary: 'Campanien. Craie blanche a silex, riche en foraminiferes et echinodermes. Haut niveau marin global.' } },
  { prefixes: ['c4'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Santonien', color: '#E2F2B0', ageStartMa: 86.3, ageEndMa: 83.6, wikiSlug: 'Santonien', summary: 'Santonien. Etage defini a Saintes (Charente-Maritime). Craie et calcaires de plate-forme.' } },
  { prefixes: ['c3'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Coniacien', color: '#BFE48A', ageStartMa: 89.8, ageEndMa: 86.3, wikiSlug: 'Coniacien', summary: 'Coniacien. Etage defini a Cognac. Craie a inocerames et formations crayeuses de plate-forme.' } },
  { prefixes: ['c2'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Turonien', color: '#A6D468', ageStartMa: 93.9, ageEndMa: 89.8, wikiSlug: 'Turonien', summary: 'Turonien. Etage defini en Touraine. Tuffeau blanc, calcaires crayeux et craie a silex.' } },
  { prefixes: ['c1'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace sup.', etage: 'Cenomanien', color: '#A6D468', ageStartMa: 100.5, ageEndMa: 93.9, wikiSlug: 'Cénomanien', summary: 'Cenomanien. Etage defini au Mans (Cenomanum). Sables, gres glauconieux et calcaires. Transgression marine majeure.' } },

  // Cretace inferieur
  { prefixes: ['n6'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Albien', color: '#7ECD74', ageStartMa: 113.0, ageEndMa: 100.5, wikiSlug: 'Albien', summary: 'Albien. Argiles et sables (sables verts). Important aquifere du Bassin parisien (nappe de l\'Albien).' } },
  { prefixes: ['n5'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: 'Cretace inf.', etage: 'Aptien', color: '#7ECD74', ageStartMa: 121.4, ageEndMa: 113.0, wikiSlug: 'Aptien', summary: 'Aptien. Etage defini a Apt (Vaucluse). Marnes, calcaires et gres avec faune d\'ammonites et rudistes.' } },

  // Jurassique superieur
  { prefixes: ['j7'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. sup.', etage: 'Tithonien', color: '#B3D4FF', ageStartMa: 152.1, ageEndMa: 145.0, wikiSlug: 'Tithonien', summary: 'Tithonien. Dernier etage du Jurassique. Calcaires lithographiques et faunes d\'ammonites diversifiees.' } },
  { prefixes: ['j6'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. sup.', etage: 'Kimmeridgien', color: '#B3D4FF', ageStartMa: 157.3, ageEndMa: 152.1, wikiSlug: 'Kimméridgien', summary: 'Kimmeridgien. Calcaires et marnes de plate-forme. Roche-mere petrolifere importante (schistes bitumineux).' } },
  { prefixes: ['j5'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. sup.', etage: 'Oxfordien', color: '#B3D4FF', ageStartMa: 163.5, ageEndMa: 157.3, wikiSlug: 'Oxfordien', summary: 'Oxfordien. Calcaires recifaux et marnes. Etage riche en coraux, spongiaires et ammonites.' } },

  // Jurassique moyen
  { prefixes: ['j4'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. moy.', etage: 'Callovien', color: '#80CFFF', ageStartMa: 166.1, ageEndMa: 163.5, wikiSlug: 'Callovien', summary: 'Callovien. Marnes et calcaires oolithiques. Riche faune d\'ammonites et de brachiopodes.' } },
  { prefixes: ['j3'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. moy.', etage: 'Bajocien', color: '#80CFFF', ageStartMa: 170.3, ageEndMa: 166.1, wikiSlug: 'Bajocien', summary: 'Bajocien. Etage defini a Bayeux. Calcaires oolithiques et marnes. Riche en ammonites et brachiopodes.' } },

  // Jurassique inferieur
  { prefixes: ['j2'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf.', etage: 'Sinemurien', color: '#34B2E8', ageStartMa: 199.5, ageEndMa: 195.3, wikiSlug: 'Sinémurien', summary: 'Sinemurien. Etage defini a Semur-en-Auxois. Calcaires a gryphees et marnes a ammonites.' } },
  { prefixes: ['j1'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf.', etage: 'Hettangien', color: '#34B2E8', ageStartMa: 201.4, ageEndMa: 199.5, wikiSlug: 'Hettangien', summary: 'Hettangien. Premier etage du Jurassique, defini a Hettange (Moselle). Calcaires et dolomies.' } },

  // Lias
  { prefixes: ['l4'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Toarcien', color: '#34B2E8', ageStartMa: 184.2, ageEndMa: 174.7, wikiSlug: 'Toarcien', summary: 'Toarcien. Etage defini a Thouars. Schistes cartons bitumineux et marnes a ammonites. Crise oceanique anoxique.' } },
  { prefixes: ['l3'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Pliensbachien', color: '#34B2E8', ageStartMa: 195.3, ageEndMa: 184.2, wikiSlug: 'Pliensbachien', summary: 'Pliensbachien. Calcaires argileux et marnes. Riche faune d\'ammonites et de belemnites.' } },
  { prefixes: ['l2'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Sinemurien', color: '#34B2E8', ageStartMa: 199.5, ageEndMa: 195.3, wikiSlug: 'Sinémurien', summary: 'Sinemurien. Calcaires a gryphees et marnes a ammonites.' } },
  { prefixes: ['l1'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: 'Jur. inf. (Lias)', etage: 'Hettangien', color: '#34B2E8', ageStartMa: 201.4, ageEndMa: 199.5, wikiSlug: 'Hettangien', summary: 'Hettangien. Premier etage du Jurassique. Calcaires et dolomies de transgression.' } },

  // Quaternaire (multi-prefix)
  { prefixes: ['Hydro', 'GLB'], entry: { ere: '', periode: 'Domaine marin/hydro', systeme: '', etage: '', color: '#C8E8FF', summary: 'Domaine marin et hydrographique. Zones immergees ou formations liees aux cours d\'eau.' } },
  { prefixes: ['SGH'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Formations superficielles et depots glaciaires ou periglaciaires.' } },
  { prefixes: ['SL', 'VL'], entry: { ere: '', periode: 'Domaine marin/hydro', systeme: '', etage: '', color: '#C8E8FF', summary: 'Domaine marin et littoral. Formations cotieres et sediments marins actuels.' } },
  { prefixes: ['SC'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Formations superficielles, colluvions et depots de pente.' } },
  { prefixes: ['CF'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Cones de dejection et formations alluviales torrentielles.' } },
  { prefixes: ['LP'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Formations lacustres et palustres.' } },
  { prefixes: ['OE'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Formations eoliennes, loess et sables eoliens.' } },
  { prefixes: ['Tz'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Tourbieres et formations organiques actuelles.' } },
  { prefixes: ['Fz', 'Fy', 'Fx', 'Fw', 'Fv', 'Fu'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Alluvions fluviatiles de differents niveaux de terrasses.' } },
  { prefixes: ['B-'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: 'Formations superficielles', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Formations superficielles quaternaires. Depots meubles recouvrant le substratum.' } },

  // Single-char: Eocene generic, must come after e1-e7
  { prefixes: ['e'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Eocene', etage: '', color: '#FDB46C', ageStartMa: 56.0, ageEndMa: 33.9, wikiSlug: 'Éocène', summary: 'Eocene (56-34 Ma). Climat subtropical en France, calcaires lacustres et formations detritiques.' } },

  // Cretace generic (after c1-c6)
  { prefixes: ['c'], entry: { ere: 'Mesozoique', periode: 'Cretace', systeme: '', etage: '', color: '#A6D468', ageStartMa: 145.0, ageEndMa: 66.0, wikiSlug: 'Crétacé', summary: 'Cretace (145-66 Ma). Derniere periode du Mesozoique, terminee par l\'extinction K-Pg. Craie, calcaires et gres.' } },

  // Jurassique / Lias generic (after j1-j7, l1-l4)
  { prefixes: ['j', 'l'], entry: { ere: 'Mesozoique', periode: 'Jurassique', systeme: '', etage: '', color: '#34B2E8', ageStartMa: 201.4, ageEndMa: 145.0, wikiSlug: 'Jurassique', summary: 'Jurassique (201-145 Ma). Calcaires, marnes et dolomies de plate-forme. Faunes marines riches en ammonites.' } },

  // Other periods
  { prefixes: ['p'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Pliocene', etage: '', color: '#FFFF99', ageStartMa: 5.33, ageEndMa: 2.58, wikiSlug: 'Pliocène', summary: 'Pliocene (5.3-2.6 Ma). Refroidissement progressif et mise en place des paysages actuels. Sables, argiles et formations lacustres.' } },
  { prefixes: ['m'], entry: { ere: 'Cenozoique', periode: 'Neogene', systeme: 'Miocene', etage: '', color: '#FFFF00', ageStartMa: 23.03, ageEndMa: 5.33, wikiSlug: 'Miocène', summary: 'Miocene (23-5 Ma). Diversification des mammiferes, formation des Alpes. Molasses, calcaires lacustres et faluns.' } },
  { prefixes: ['g'], entry: { ere: 'Cenozoique', periode: 'Paleogene', systeme: 'Oligocene', etage: '', color: '#FDC07A', ageStartMa: 33.9, ageEndMa: 23.03, wikiSlug: 'Oligocène', summary: 'Oligocene (34-23 Ma). Rifting europeen, formation des fosses d\'effondrement. Calcaires lacustres et marnes.' } },
  { prefixes: ['t'], entry: { ere: 'Mesozoique', periode: 'Trias', systeme: '', etage: '', color: '#812B92', ageStartMa: 251.9, ageEndMa: 201.4, wikiSlug: 'Trias', summary: 'Trias (252-201 Ma). Premiere periode du Mesozoique. Gres, evaporites et dolomies en milieu continental a marin peu profond.' } },
  { prefixes: ['r'], entry: { ere: 'Paleozoique', periode: 'Permien', systeme: '', etage: '', color: '#F04028', ageStartMa: 298.9, ageEndMa: 251.9, wikiSlug: 'Permien', summary: 'Permien (299-252 Ma). Derniere periode du Paleozoique, terminee par la plus grande extinction de masse. Gres rouges et evaporites.' } },
  { prefixes: ['h'], entry: { ere: 'Paleozoique', periode: 'Carbonifere', systeme: '', etage: '', color: '#67A599', ageStartMa: 358.9, ageEndMa: 298.9, wikiSlug: 'Carbonifère', summary: 'Carbonifere (359-299 Ma). Grandes forets houilleres et formation du charbon. Schistes, gres et calcaires.' } },
  { prefixes: ['d'], entry: { ere: 'Paleozoique', periode: 'Devonien', systeme: '', etage: '', color: '#CB8C37', ageStartMa: 419.2, ageEndMa: 358.9, wikiSlug: 'Dévonien', summary: 'Devonien (419-359 Ma). Age des poissons. Calcaires recifaux, schistes et gres. Orogene hercynien debutant.' } },
  { prefixes: ['s'], entry: { ere: 'Paleozoique', periode: 'Silurien', systeme: '', etage: '', color: '#B3E1B6', ageStartMa: 443.8, ageEndMa: 419.2, wikiSlug: 'Silurien', summary: 'Silurien (444-419 Ma). Premieres plantes terrestres. Schistes a graptolites et calcaires recifaux.' } },
  { prefixes: ['o'], entry: { ere: 'Paleozoique', periode: 'Ordovicien', systeme: '', etage: '', color: '#009270', ageStartMa: 485.4, ageEndMa: 443.8, wikiSlug: 'Ordovicien', summary: 'Ordovicien (485-444 Ma). Grande diversification marine. Schistes, gres armoricain et glaciation fini-ordovicienne.' } },
  { prefixes: ['k'], entry: { ere: 'Paleozoique', periode: 'Cambrien', systeme: '', etage: '', color: '#7FA08C', ageStartMa: 538.8, ageEndMa: 485.4, wikiSlug: 'Cambrien', summary: 'Cambrien (539-485 Ma). Explosion cambrienne de la vie marine. Gres, schistes et calcaires a trilobites.' } },
  { prefixes: ['b'], entry: { ere: 'Precambrien', periode: 'Brioverien', systeme: '', etage: '', color: '#F4B8D4', ageStartMa: 670, ageEndMa: 538.8, wikiSlug: 'Briovérien', summary: 'Brioverien (Neoproterozoique). Formations sedimentaires et volcaniques du Massif armoricain. Schistes et grauwackes.' } },

  // Roches cristallines
  { prefixes: ['Èæ', 'ã', 'î', 'ó', 'Ã', 'Õ', 'ñ', 'Å', 'Û', '¥', 'Ê', 'ï', 'â'], entry: { ere: '', periode: 'Roches cristallines', systeme: '', etage: '', color: '#E36DAA', summary: 'Roches cristallines. Granites, gneiss, micaschistes et autres roches du socle metamorphique et magmatique.' } },

  // Quaternaire catch-all (single chars)
  { prefixes: ['q', 'F', 'C', 'D', 'E', 'K', 'S', 'U', 'X', 'R'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Formations superficielles, alluvions et depots recents.' } },
  { prefixes: ['°', '³'], entry: { ere: 'Cenozoique', periode: 'Quaternaire', systeme: '', etage: '', color: '#F9F97F', ageStartMa: 2.58, ageEndMa: 0, wikiSlug: 'Quaternaire', summary: 'Quaternaire. Formations superficielles et depots recents.' } },

  // Alterites
  { prefixes: ['¡'], entry: { ere: '', periode: 'Alterites', systeme: '', etage: '', color: '#E8D0A0', summary: 'Alterites. Manteau d\'alteration et formations residuelles.' } },
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
