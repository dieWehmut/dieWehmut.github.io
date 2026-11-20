import type { ImageAnnotation } from './imageAnnotations'

const SVG = 'http://www.w3.org/2000/svg'

/** Use the same image coordinates in the editor, documents and gallery thumbnails. */
export function renderImageAnnotations(
  layer: SVGSVGElement,
  image: Pick<HTMLImageElement, 'naturalWidth' | 'naturalHeight'>,
  items: ImageAnnotation[],
): number {
  const height = image.naturalWidth && image.naturalHeight ? 1000 * image.naturalHeight / image.naturalWidth : 1000
  const document = layer.ownerDocument
  layer.setAttribute('viewBox', `0 0 1000 ${height}`)
  layer.replaceChildren()
  for (const item of items) {
    if (item.kind === 'text') {
      const text = document.createElementNS(SVG, 'text')
      text.setAttribute('x', String(item.x * 1000))
      text.setAttribute('y', String(item.y * height))
      text.setAttribute('fill', item.color)
      text.setAttribute('font-size', String(item.size * 1000))
      text.setAttribute('font-family', 'system-ui, sans-serif')
      text.setAttribute('dominant-baseline', 'hanging')
      if (item.x > 0.7) text.setAttribute('text-anchor', 'end')
      for (const [index, line] of item.text.split('\n').entries()) {
        const span = document.createElementNS(SVG, 'tspan')
        span.setAttribute('x', String(item.x * 1000))
        span.setAttribute('dy', index ? '1.3em' : '0')
        span.textContent = line
        text.append(span)
      }
      layer.append(text)
    } else {
      const path = document.createElementNS(SVG, 'polyline')
      const points = item.points.length === 1 ? [...item.points, item.points[0]] : item.points
      path.setAttribute('points', points.map((p) => `${p.x * 1000},${p.y * height}`).join(' '))
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', item.color)
      path.setAttribute('stroke-width', String(item.width * 1000))
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('stroke-linejoin', 'round')
      if (item.kind === 'highlighter') path.setAttribute('opacity', '0.35')
      layer.append(path)
    }
  }
  return height
}
