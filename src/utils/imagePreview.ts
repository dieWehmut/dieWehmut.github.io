import { retryPublicAssetImage } from './publicAssets'

let overlay: HTMLDivElement | null = null
let stage: HTMLDivElement | null = null
let previewImage: HTMLImageElement | null = null
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
  overlay.classList.remove('is-open')
  previewImage.removeAttribute('src')
  previewImage.alt = ''
  document.body.style.overflow = previousBodyOverflow
  previewItems = []
  currentIndex = 0
  resetZoom()
  isOpen = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeImagePreview()
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showPreviousImage()
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    showNextImage()
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    setScale(scale * 1.15)
  }
  if (event.key === '-') {
    event.preventDefault()
    setScale(scale / 1.15)
  }
  if (event.key === '0') {
    event.preventDefault()
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

  stage = document.createElement('div')
  stage.className = 'image-preview__stage'

  previewImage = document.createElement('img')
  previewImage.className = 'image-preview__image'
  previewImage.alt = ''
  previewImage.draggable = false

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

  stage.append(previewImage)
  overlay.append(stage, previousButton, nextButton, closeButton)
  document.body.appendChild(overlay)
}

function onPreviewImageError() {
  if (!previewImage || !previewItems.length) return
  retryPublicAssetImage(previewImage, previewItems[currentIndex]?.src)
}

function onOverlayClick(event: MouseEvent) {
  if (!overlay || !stage) return
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
  if (!previewImage) return
  previewImage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
  previewImage.style.cursor = scale > 1 ? 'grab' : 'zoom-in'
}

function onWheel(event: WheelEvent) {
  if (!isOpen) return
  event.preventDefault()
  setScale(scale * (event.deltaY > 0 ? 0.88 : 1.12))
}

function onPointerDown(event: PointerEvent) {
  if (scale <= 1 || !previewImage) return
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

  if (!isOpen) previousBodyOverflow = document.body.style.overflow
  previewItems = normalizedItems
  setCurrentImage(clamp(index, 0, previewItems.length - 1))
  document.body.style.overflow = 'hidden'
  overlay.classList.add('is-open')
  overlay.focus()
  isOpen = true
}

export function openImagePreview(src: string, alt = '') {
  openImagePreviewGallery([{ src, alt }], 0)
}
