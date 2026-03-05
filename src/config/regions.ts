import type { LngLatBoundsLike, LngLatLike } from 'maplibre-gl'

export interface RegionConfig {
  id: string
  name: string
  bounds: LngLatBoundsLike
  center: LngLatLike
  zoom: number
}

export const REGIONS: readonly RegionConfig[] = [
  {
    id: 'auvergne-rhone-alpes',
    name: 'Auvergne-Rhone-Alpes',
    bounds: [[2.0, 44.0], [7.2, 46.8]],
    center: [4.5, 45.4],
    zoom: 7
  },
  {
    id: 'bourgogne-franche-comte',
    name: 'Bourgogne-Franche-Comte',
    bounds: [[2.8, 46.0], [7.1, 48.4]],
    center: [5.0, 47.2],
    zoom: 7
  },
  {
    id: 'bretagne',
    name: 'Bretagne',
    bounds: [[-5.2, 47.2], [-0.8, 48.9]],
    center: [-3.0, 48.1],
    zoom: 8
  },
  {
    id: 'centre-val-de-loire',
    name: 'Centre-Val de Loire',
    bounds: [[0.0, 46.3], [3.1, 48.6]],
    center: [1.5, 47.5],
    zoom: 7
  },
  {
    id: 'corse',
    name: 'Corse',
    bounds: [[8.5, 41.3], [9.6, 43.1]],
    center: [9.1, 42.2],
    zoom: 8
  },
  {
    id: 'grand-est',
    name: 'Grand Est',
    bounds: [[3.3, 47.4], [8.3, 50.2]],
    center: [5.8, 48.8],
    zoom: 7
  },
  {
    id: 'hauts-de-france',
    name: 'Hauts-de-France',
    bounds: [[1.3, 48.8], [4.3, 51.1]],
    center: [2.8, 49.9],
    zoom: 7
  },
  {
    id: 'ile-de-france',
    name: 'Ile-de-France',
    bounds: [[1.4, 48.1], [3.6, 49.3]],
    center: [2.5, 48.7],
    zoom: 9
  },
  {
    id: 'normandie',
    name: 'Normandie',
    bounds: [[-2.0, 48.0], [1.8, 49.8]],
    center: [-0.5, 48.85],
    zoom: 8
  },
  {
    id: 'nouvelle-aquitaine',
    name: 'Nouvelle-Aquitaine',
    bounds: [[-1.8, 42.8], [2.6, 46.9]],
    center: [0.4, 44.8],
    zoom: 7
  },
  {
    id: 'occitanie',
    name: 'Occitanie',
    bounds: [[-0.4, 42.3], [4.8, 45.1]],
    center: [2.2, 43.7],
    zoom: 7
  },
  {
    id: 'pays-de-la-loire',
    name: 'Pays de la Loire',
    bounds: [[-2.6, 46.2], [0.9, 48.5]],
    center: [-0.9, 47.3],
    zoom: 8
  },
  {
    id: 'provence-alpes-cote-dazur',
    name: "Provence-Alpes-Cote d'Azur",
    bounds: [[4.2, 42.9], [7.7, 45.1]],
    center: [5.9, 44.0],
    zoom: 7
  }
]

export const FRANCE_BOUNDS: LngLatBoundsLike = [[-5.5, 41.0], [10.0, 51.5]]
export const FRANCE_CENTER: LngLatLike = [2.2, 46.6]
export const DEFAULT_REGION = 'normandie'

export function getRegion(id: string): RegionConfig | undefined {
  return REGIONS.find(r => r.id === id)
}
