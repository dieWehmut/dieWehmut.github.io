import { retryPublicAssetImage } from './publicAssets'
import { createImageAnnotationEditor } from './imageAnnotationEditor'

let overlay: HTMLDivElement | null = null
let stage: HTMLDivElement | null = null
let previewImage: HTMLImageElement | null = null
let surface: HTMLDivElement | null = null
let annotations: ReturnType<typeof createImageAnnotationEditor> | null = null
let previousFocus: HTMLElement | null = null
let previousButton: HTMLButtonElement | null = null
let nextButton: HTMLButtonElement | null = null
let previousBodyOverflow = ''
let isOpen = false
let previewItems: ImagePreviewItem[] = []
let currentIndex = 0
let scale = 1
let offsetX = 0
let offsetY = 0
let dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null = null

export type ImagePreviewItem = {
  src: string
  alt?: string
}

function closeImagePreview() {
  if (!overlay || !previewImage || !isOpen) return
  annotations?.close()
  overlay.classList.remove('is-open')
  overlay.inert = true
  overlay.setAttribute('aria-hidden', 'true')
  previewImage.removeAttribute('src')
  previewImage.alt = ''
  document.body.style.overflow = previousBodyOverflow
  previewItems = []
  currentIndex = 0
  resetZoom()
  isOpen = false
  previousFocus?.focus({ preventScroll: true })
  previousFocus = null
}

function stopPreviewKey(event: KeyboardEvent) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

function onKeydown(event: KeyboardEvent) {
  if (!isOpen) return
  if (event.key === 'Tab' && overlay) {
    const controls = Array.from(overlay.querySelectorAll<HTMLElement>('button,input,textarea'))
      .filter((element) => !element.hasAttribute('disabled') && element.getClientRects().length)
    const boundary = event.shiftKey ? controls[0] : controls.at(-1)
    if (document.activeElement === boundary || document.activeElement === overlay) {
      event.preventDefault()
      ;(event.shiftKey ? controls.at(-1) : controls[0])?.focus()
    }
  }
  if (annotations?.handleKeydown(event)) {
    event.stopImmediatePropagation()
    return
  }
  if (event.key === 'Escape') {
    stopPreviewKey(event)
    closeImagePreview()
  }
  if (event.key === 'ArrowLeft') {
    stopPreviewKey(event)
    showPreviousImage()
  }
  if (event.key === 'ArrowRight') {
    stopPreviewKey(event)
    showNextImage()
  }
  if (event.key === '+' || event.key === '=') {
    stopPreviewKey(event)
    setScale(scale * 1.15)
  }
  if (event.key === '-') {
    stopPreviewKey(event)
    setScale(scale / 1.15)
  }
  if (event.key === '0') {
    stopPreviewKey(event)
    resetZoom()
  }
}

function ensureOverlay() {
  if (overlay && previewImage) return

  overlay = document.createElement('div')
  overlay.className = 'image-preview'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', 'Image preview')
  overlay.tabIndex = -1
  overlay.inert = true
  overlay.setAttribute('aria-hidden', 'true')

  stage = document.createElement('div')
  stage.className = 'image-preview__stage'

  previewImage = document.createElement('img')
  previewImage.className = 'image-preview__image'
  previewImage.alt = ''
  previewImage.draggable = false
  surface = document.createElement('div')
  surface.className = 'image-preview__surface'
  surface.append(previewImage)

  previousButton = document.createElement('button')
  previousButton.className = 'image-preview__nav image-preview__nav--previous'
  previousButton.type = 'button'
  previousButton.setAttribute('aria-label', 'Previous image')
  previousButton.textContent = '<'

  nextButton = document.createElement('button')
  nextButton.className = 'image-preview__nav image-preview__nav--next'
  nextButton.type = 'button'
  nextButton.setAttribute('aria-label', 'Next image')
  nextButton.textContent = '>'

  const closeButton = document.createElement('button')
  closeButton.className = 'image-preview__close'
  closeButton.type = 'button'
  closeButton.setAttribute('aria-label', 'Close image preview')
  closeButton.textContent = 'x'

  const zoom = document.createElement('div')
  zoom.className = 'image-preview__zoom'
  for (const [label, title, multiplier] of [['−', 'Zoom out image', 1 / 1.2], ['+', 'Zoom in image', 1.2]] as const) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.setAttribute('aria-label', title)
    button.addEventListener('click', () => setScale(scale * multiplier))
    zoom.append(button)
  }

  overlay.addEventListener('click', onOverlayClick)
  overlay.addEventListener('wheel', onWheel, { passive: false })
  previewImage.addEventListener('pointerdown', onPointerDown)
  previewImage.addEventListener('error', onPreviewImageError)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  previousButton.addEventListener('click', showPreviousImage)
  nextButton.addEventListener('click', showNextImage)
  closeButton.addEventListener('click', closeImagePreview)
  window.addEventListener('keydown', onKeydown)

  stage.append(surface)
  overlay.append(stage, previousButton, nextButton, closeButton, zoom)
  annotations = createImageAnnotationEditor({ overlay, surface, image: previewImage, onModeChange: applyTransform })
  document.body.appendChild(overlay)
}

function onPreviewImageError() {
  if (!previewImage || !previewItems.length) return
  retryPublicAssetImage(previewImage, previewItems[currentIndex]?.src)
}

function onOverlayClick(event: MouseEvent) {
  if (!overlay || !stage || !annotations?.allowsPan()) return
  if (event.target !== overlay && event.target !== stage) return
  if (previewItems.length <= 1) {
    closeImagePreview()
    return
  }

  const rect = overlay.getBoundingClientRect()
  const x = event.clientX - rect.left
  if (x < rect.width * 0.42) showPreviousImage()
  if (x > rect.width * 0.58) showNextImage()
}

function normalizePreviewItems(items: ImagePreviewItem[]) {
  return items
    .map((item) => ({
      src: String(item.src || '').trim(),
      alt: String(item.alt || ''),
    }))
    .filter((item) => item.src)
}

function setCurrentImage(index: number) {
  if (!previewImage || !previousButton || !nextButton || !previewItems.length) return
  currentIndex = (index + previewItems.length) % previewItems.length
  const item = previewItems[currentIndex]
  previewImage.src = item.src
  previewImage.alt = item.alt || ''
  delete previewImage.dataset.publicAssetTried
  delete previewImage.dataset.originalSrc
  void annotations?.setImage(item.src)
  previousButton.hidden = previewItems.length <= 1
  nextButton.hidden = previewItems.length <= 1
  resetZoom()
}

function showPreviousImage() {
  if (previewItems.length <= 1) return
  setCurrentImage(currentIndex - 1)
}

function showNextImage() {
  if (previewItems.length <= 1) return
  setCurrentImage(currentIndex + 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function setScale(value: number) {
  scale = clamp(value, 0.35, 8)
  if (scale <= 1) {
    offsetX = 0
    offsetY = 0
  }
  applyTransform()
}

function resetZoom() {
  scale = 1
  offsetX = 0
  offsetY = 0
  dragStart = null
  applyTransform()
}

function applyTransform() {
  if (!previewImage || !surface) return
  surface.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
  previewImage.style.cursor = annotations?.allowsPan() && scale > 1 ? 'grab' : 'zoom-in'
}

function onWheel(event: WheelEvent) {
  if (!isOpen) return
  if ((event.target as Element)?.closest('.image-annotation__toolbar,.image-annotation__text-editor')) return
  event.preventDefault()
  if (annotations?.isDrawing()) return
  setScale(scale * (event.deltaY > 0 ? 0.88 : 1.12))
}

function onPointerDown(event: PointerEvent) {
  if (scale <= 1 || !previewImage || event.button !== 0 || !annotations?.allowsPan()) return
  event.preventDefault()
  previewImage.setPointerCapture(event.pointerId)
  previewImage.style.cursor = 'grabbing'
  dragStart = {
    x: event.clientX,
    y: event.clientY,
    offsetX,
    offsetY,
  }
}

function onPointerMove(event: PointerEvent) {
  if (!dragStart || !previewImage) return
  offsetX = dragStart.offsetX + event.clientX - dragStart.x
  offsetY = dragStart.offsetY + event.clientY - dragStart.y
  previewImage.style.cursor = 'grabbing'
  applyTransform()
}

function onPointerUp(event: PointerEvent) {
  if (!dragStart) return
  try {
    previewImage?.releasePointerCapture(event.pointerId)
  } catch {
    // Pointer capture may already be released by the browser.
  }
  dragStart = null
  applyTransform()
}

export function openImagePreviewGallery(items: ImagePreviewItem[], index = 0) {
  if (typeof document === 'undefined') return
  const normalizedItems = normalizePreviewItems(items)
  if (!normalizedItems.length) return

  ensureOverlay()
  if (!overlay || !previewImage) return

  if (!isOpen) {
    previousBodyOverflow = document.body.style.overflow
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  previewItems = normalizedItems
  setCurrentImage(clamp(index, 0, previewItems.length - 1))
  document.body.style.overflow = 'hidden'
  overlay.classList.add('is-open')
  overlay.inert = false
  overlay.setAttribute('aria-hidden', 'false')
  overlay.focus()
  isOpen = true
}

export function openImagePreview(src: string, alt = '') {
  openImagePreviewGallery([{ src, alt }], 0)
}
