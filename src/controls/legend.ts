import { LEGEND_PERIODS } from '../utils/colors.ts'

export function setupLegend(): void {
  const container = document.createElement('div')
  container.className = 'legend-panel'

  const title = document.createElement('h3')
  title.textContent = 'Periodes geologiques'
  container.appendChild(title)

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
    container.appendChild(item)
  }

  document.body.appendChild(container)
}
