import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { FRANCE_CENTER } from '../config/regions.ts'

const DEFAULT_ZOOM = 6

export function createMap(container: string): maplibregl.Map {
  // Register PMTiles protocol
  const protocol = new Protocol()
  maplibregl.addProtocol('pmtiles', protocol.tile)

  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'osm': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxzoom: 19
        }
      },
      layers: [
        {
          id: 'osm-base',
          type: 'raster',
          source: 'osm',
          paint: {}
        }
      ]
    },
    center: FRANCE_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 5,
    maxZoom: 16
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

  return map
}
