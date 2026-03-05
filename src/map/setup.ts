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
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri',
          maxzoom: 18
        },
        'topo': {
          type: 'raster',
          tiles: [
            'https://a.tile.opentopomap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenTopoMap',
          maxzoom: 17
        }
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'satellite',
          paint: {
            'raster-brightness-max': 0.6,
            'raster-saturation': -0.3
          }
        },
        {
          id: 'topo-overlay',
          type: 'raster',
          source: 'topo',
          paint: {
            'raster-opacity': 0.25
          }
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
