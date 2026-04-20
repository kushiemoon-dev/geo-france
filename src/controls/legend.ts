import { LEGEND_PERIODS } from '../utils/colors.ts'
import { bus } from '../core/events.ts'

const WMS_LEGEND_URL = 'https://geoservices.brgm.fr/geologie?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&LAYER=SCAN_H_GEOL50&FORMAT=image/png&STYLE=default'

export function setupLegend(): void {
  const container = document.createElement('div')
  container.className = 'legend-panel'

  const title = document.createElement('h3')
  title.textContent = 'Périodes géologiques'
  container.appendChild(title)

  // National legend: period swatches
  const nationalContent = document.createElement('div')
  nationalContent.className = 'legend-national'

  for (const entry of LEGEND_PERIODS) {
    const item = document.createElement('div')
    item.className = 'legend-item'

    const swatch = document.createElement('span')
    swatch.className = 'legend-swatch'
    swatch.style.backgroundColor = entry.color

    const label = document.createElement('span')
    label.className = 'legend-label'
    label.textContent = entry.label

    item.appendChild(swatch)
    item.appendChild(label)
    nationalContent.appendChild(item)
  }

  container.appendChild(nationalContent)

  // Local legend: WMS GetLegendGraphic image
  const localContent = document.createElement('div')
  localContent.className = 'legend-local'
  localContent.style.display = 'none'

  const localImg = document.createElement('img')
  localImg.alt = 'Légende carte géologique 1/50 000'
  localImg.style.maxWidth = '100%'
  localImg.style.borderRadius = '4px'

  localContent.appendChild(localImg)
  container.appendChild(localContent)

  bus.on('mode:change', ({ mode }) => {
    if (mode === 'local') {
      title.textContent = 'Legende BRGM 1/50k'
      nationalContent.style.display = 'none'
      localContent.style.display = ''
      if (!localImg.src) {
        localImg.src = WMS_LEGEND_URL
      }
    } else {
      title.textContent = 'Périodes géologiques'
      nationalContent.style.display = ''
      localContent.style.display = 'none'
    }
  })

  document.body.appendChild(container)
}
