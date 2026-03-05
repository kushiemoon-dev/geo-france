import type { Map } from 'maplibre-gl'

function createDipIconData(size: number): ImageData {
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d')!
  const center = size / 2
  const lineWidth = Math.max(1, size / 16)

  ctx.strokeStyle = 'black'
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'

  // Strike line (horizontal, full width)
  ctx.beginPath()
  ctx.moveTo(0, center)
  ctx.lineTo(size, center)
  ctx.stroke()

  // Dip tick (vertical, from center upward — points north = 0°)
  ctx.beginPath()
  ctx.moveTo(center, center)
  ctx.lineTo(center, 0)
  ctx.stroke()

  return ctx.getImageData(0, 0, size, size)
}

export function registerDipIcon(map: Map): void {
  const size = 32
  const imageData = createDipIconData(size)

  map.addImage('dip-symbol', {
    width: size,
    height: size,
    data: imageData.data
  }, { sdf: true })
}
