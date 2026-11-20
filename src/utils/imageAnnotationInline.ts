import {
  annotationImageKey, cachedImageAnnotations, readImageAnnotations, subscribeImageAnnotations,
  type ImageAnnotation,
} from './imageAnnotations'
import { renderImageAnnotations } from './imageAnnotationRender'
import { getPublicAssetUrlCandidates } from './publicAssets'

type ImageState = {
  key: string
  items: ImageAnnotation[]
  layer: SVGSVGElement | null
  parent: HTMLElement | null
}

/** Add read-only annotation layers without wrapping images or replacing Vue-owned nodes. */
export function bindInlineImageAnnotations(root: HTMLElement): () => void {
  const images = new Map<HTMLImageElement, ImageState>()
  const parents = new Map<HTMLElement, { count: number; position: string | null }>()
  let disposed = false

  function removeLayer(state: ImageState) {
    state.layer?.remove()
    state.layer = null
    if (!state.parent) return
    const parent = state.parent
    const saved = parents.get(parent)
    if (saved && --saved.count === 0) {
      if (saved.position !== null && parent.style.position === 'relative') parent.style.position = saved.position
      resize.unobserve(parent)
      parents.delete(parent)
    }
    state.parent = null
  }

  function layout(image: HTMLImageElement, state: ImageState) {
    const layer = state.layer
    if (!layer) return
    const style = getComputedStyle(image)
    const paddingLeft = parseFloat(style.paddingLeft) || 0
    const paddingTop = parseFloat(style.paddingTop) || 0
    const width = image.clientWidth - paddingLeft - (parseFloat(style.paddingRight) || 0)
    const height = image.clientHeight - paddingTop - (parseFloat(style.paddingBottom) || 0)
    layer.style.left = `${image.offsetLeft + image.clientLeft + paddingLeft}px`
    layer.style.top = `${image.offsetTop + image.clientTop + paddingTop}px`
    layer.style.width = `${Math.max(0, width)}px`
    layer.style.height = `${Math.max(0, height)}px`
    layer.style.borderRadius = style.borderRadius
    // Thumbnails use cover/contain, whereas document images use their natural proportions.
    // Match arbitrary object-position values as well as the default centered position.
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    const fit = style.objectFit
    let scaleX = width / naturalWidth
    let scaleY = height / naturalHeight
    if (fit !== 'fill') {
      const scale = fit === 'cover' ? Math.max(scaleX, scaleY)
        : fit === 'none' ? 1
          : fit === 'scale-down' ? Math.min(1, scaleX, scaleY) : Math.min(scaleX, scaleY)
      scaleX = scaleY = scale
    }
    const positions = style.objectPosition.split(/\s+/)
    const offset = (value: string | undefined, free: number) => {
      if (!value) return free / 2
      if (value.endsWith('%')) return free * parseFloat(value) / 100
      if (value.endsWith('px')) return parseFloat(value)
      return free / 2
    }
    const x = offset(positions[0], width - naturalWidth * scaleX)
    const y = offset(positions[1], height - naturalHeight * scaleY)
    // An outer viewport clips cover thumbnails; the inner SVG keeps original image coordinates.
    layer.setAttribute('viewBox', `0 0 ${Math.max(1, width)} ${Math.max(1, height)}`)
    const drawing = layer.firstElementChild
    if (drawing) {
      drawing.setAttribute('x', String(x))
      drawing.setAttribute('y', String(y))
      drawing.setAttribute('width', String(naturalWidth * scaleX))
      drawing.setAttribute('height', String(naturalHeight * scaleY))
    }
  }

  function render(image: HTMLImageElement, state: ImageState) {
    if (disposed || !root.contains(image)) return
    if (!state.items.length || !image.naturalWidth || !image.naturalHeight) { removeLayer(state); return }
    const parent = image.parentElement
    if (!parent) return
    if (state.parent !== parent) removeLayer(state)
    if (!state.layer) {
      let saved = parents.get(parent)
      if (!saved) {
        const position = getComputedStyle(parent).position === 'static' ? parent.style.position : null
        saved = { count: 0, position }
        parents.set(parent, saved)
        if (position !== null) parent.style.position = 'relative'
      }
      saved.count++
      resize.observe(parent)
      const layer = image.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg')
      layer.classList.add('image-annotation__inline')
      layer.setAttribute('aria-hidden', 'true')
      layer.setAttribute('preserveAspectRatio', 'none')
      const drawing = image.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg')
      drawing.setAttribute('preserveAspectRatio', 'none')
      layer.append(drawing)
      parent.append(layer)
      state.layer = layer
      state.parent = parent
    }
    renderImageAnnotations(state.layer.firstElementChild as SVGSVGElement, image, state.items)
    layout(image, state)
  }

  function update(image: HTMLImageElement) {
    const state = images.get(image)
    if (!state) return
    const source = image.dataset.originalSrc || image.dataset.mdLazySrc || image.getAttribute('src') || ''
    let key = ''
    try { if (source) key = annotationImageKey(getPublicAssetUrlCandidates(source)[0] || source, image.baseURI) } catch { /* Invalid image URL. */ }
    if (state.key === key) { render(image, state); return }
    state.key = key
    state.items = cachedImageAnnotations(key)
    render(image, state)
    if (!key) return
    void readImageAnnotations(key).then((items) => {
      if (disposed || images.get(image) !== state || state.key !== key) return
      state.items = items
      render(image, state)
    }).catch(() => { /* A write still notifies subscribers when persistent storage is unavailable. */ })
  }

  const resize = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      if (target instanceof HTMLImageElement) {
        const state = images.get(target)
        if (state) layout(target, state)
      } else {
        for (const [image, state] of images) if (state.parent === target) layout(image, state)
      }
    }
  })
  const onLoad = (event: Event) => { if (event.target instanceof HTMLImageElement) update(event.target) }
  root.addEventListener('load', onLoad, true)
  function add(scope: Element) {
    const addImage = (image: HTMLImageElement) => {
      if (images.has(image)) return
      images.set(image, { key: '', items: [], layer: null, parent: null })
      resize.observe(image)
      update(image)
    }
    if (scope instanceof HTMLImageElement) addImage(scope)
    scope.querySelectorAll<HTMLImageElement>('img').forEach(addImage)
  }
  const unsubscribe = subscribeImageAnnotations((key, items) => {
    for (const [image, state] of images) {
      if (state.key === key) { state.items = items; render(image, state) }
    }
  })
  const observer = new MutationObserver((records) => {
    let removed = false
    for (const record of records) {
      if (record.type === 'attributes' && record.target instanceof HTMLImageElement) update(record.target)
      for (const node of record.addedNodes) if (node instanceof HTMLElement) add(node)
      for (const node of record.removedNodes) {
        if (node instanceof HTMLImageElement || (node instanceof HTMLElement && node.querySelector('img'))) removed = true
      }
    }
    if (removed) {
      for (const [image, state] of images) {
        if (root.contains(image)) continue
        removeLayer(state)
        resize.unobserve(image)
        images.delete(image)
      }
    }
  })
  observer.observe(root, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['src', 'data-original-src', 'data-md-lazy-src'] })
  add(root)
  return () => {
    disposed = true
    observer.disconnect()
    resize.disconnect()
    unsubscribe()
    root.removeEventListener('load', onLoad, true)
    for (const state of images.values()) removeLayer(state)
    images.clear()
  }
}
