import {
  annotationImageKey, cachedImageAnnotations, MAX_IMAGE_ANNOTATIONS, MAX_STROKE_POINTS,
  readImageAnnotations, writeImageAnnotations, imageAnnotationsAreTemporary,
  type AnnotationPoint, type ImageAnnotation,
} from './imageAnnotations'
import { renderImageAnnotations } from './imageAnnotationRender'

type Tool = 'pan' | 'pen' | 'highlighter' | 'text'
type Stroke = Extract<ImageAnnotation, { points: AnnotationPoint[] }>
const SVG = 'http://www.w3.org/2000/svg'

export function createImageAnnotationEditor({
  overlay, surface, image, onModeChange,
}: {
  overlay: HTMLElement
  surface: HTMLElement
  image: HTMLImageElement
  onModeChange: () => void
}) {
  let enabled = false
  let ready = false
  let tool: Tool = 'pen'
  let color = '#ef476f'
  let size = 3
  let key = ''
  let generation = 0
  let revision = 0
  let items: ImageAnnotation[] = []
  let undo: ImageAnnotation[][] = []
  let redo: ImageAnnotation[][] = []
  let draft: Stroke | null = null
  let pointer: number | null = null
  let textPosition: AnnotationPoint | null = null
  let queue: Promise<void> = Promise.resolve()
  let height = 1000

  const layer = document.createElementNS(SVG, 'svg')
  layer.classList.add('image-annotation__layer')
  layer.setAttribute('aria-label', '图片批注画布')
  layer.setAttribute('preserveAspectRatio', 'none')
  const toolbar = document.createElement('div')
  toolbar.className = 'image-annotation__toolbar'
  toolbar.setAttribute('role', 'toolbar')
  toolbar.setAttribute('aria-label', '图片批注工具')
  toolbar.hidden = true

  function button(label: string, callback: () => void, parent: HTMLElement = toolbar) {
    const element = document.createElement('button')
    element.type = 'button'
    element.textContent = label
    element.addEventListener('click', callback)
    parent.append(element)
    return element
  }

  const toggle = button('批注', () => setEnabled(!enabled), overlay)
  toggle.className = 'image-preview__annotate'
  toggle.setAttribute('aria-label', '图片批注')
  toggle.setAttribute('aria-pressed', 'false')
  const tools = new Map<Tool, HTMLButtonElement>()
  for (const [value, label] of [['pan', '移动'], ['pen', '画笔'], ['highlighter', '高亮'], ['text', '文字']] as const) {
    tools.set(value, button(label, () => {
      finishStroke()
      commitText()
      tool = value
      if (value === 'highlighter') { color = '#ffd43b'; colorInput.value = color }
      updateControls()
      onModeChange()
    }))
  }
  const colorInput = document.createElement('input')
  colorInput.type = 'color'
  colorInput.value = color
  colorInput.setAttribute('aria-label', '批注颜色')
  colorInput.addEventListener('input', () => { color = colorInput.value })
  toolbar.append(colorInput)
  const sizeLabel = document.createElement('label')
  sizeLabel.className = 'image-annotation__size'
  sizeLabel.textContent = '粗细'
  const sizeInput = document.createElement('input')
  sizeInput.type = 'range'
  sizeInput.min = '1'
  sizeInput.max = '10'
  sizeInput.value = String(size)
  sizeInput.setAttribute('aria-label', '批注粗细')
  sizeInput.addEventListener('input', () => { size = Number(sizeInput.value) })
  sizeLabel.append(sizeInput)
  toolbar.append(sizeLabel)
  const undoButton = button('撤销', () => {
    cancelDraft()
    const previous = undo.pop()
    if (previous) { redo.push(items); items = previous; changed() }
  })
  const redoButton = button('重做', () => {
    cancelDraft()
    const next = redo.pop()
    if (next) { undo.push(items); items = next; changed() }
  })
  const clearButton = button('清空', () => { cancelDraft(); if (items.length) replace([]) })
  button('完成', () => setEnabled(false))
  const status = document.createElement('span')
  status.className = 'image-annotation__status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  toolbar.append(status)

  const textEditor = document.createElement('form')
  textEditor.className = 'image-annotation__text-editor'
  textEditor.hidden = true
  const textarea = document.createElement('textarea')
  textarea.setAttribute('aria-label', '批注文字')
  textarea.placeholder = '输入批注文字'
  textarea.maxLength = 2000
  textarea.rows = 3
  const textActions = document.createElement('div')
  const saveText = document.createElement('button')
  saveText.type = 'submit'
  saveText.textContent = '添加文字'
  const cancelText = document.createElement('button')
  cancelText.type = 'button'
  cancelText.textContent = '取消'
  cancelText.addEventListener('click', () => { textPosition = null; textEditor.hidden = true; layer.focus() })
  textActions.append(saveText, cancelText)
  textEditor.append(textarea, textActions)
  textEditor.addEventListener('submit', (event) => { event.preventDefault(); commitText() })
  textEditor.addEventListener('pointerdown', (event) => event.stopPropagation())
  toolbar.addEventListener('wheel', (event) => event.stopPropagation())
  surface.append(layer)
  overlay.append(toolbar, textEditor)

  function updateControls() {
    toggle.textContent = items.length ? `批注 · ${items.length}` : '批注'
    toggle.setAttribute('aria-pressed', String(enabled))
    overlay.classList.toggle('is-annotating', enabled)
    toolbar.hidden = !enabled
    layer.classList.toggle('is-drawing', enabled && ready && tool !== 'pan')
    layer.style.cursor = tool === 'text' ? 'text' : 'crosshair'
    for (const [value, control] of tools) {
      control.setAttribute('aria-pressed', String(tool === value))
      control.disabled = !ready
    }
    undoButton.disabled = !ready || !undo.length
    redoButton.disabled = !ready || !redo.length
    clearButton.disabled = !ready || !items.length
  }

  function render() {
    height = renderImageAnnotations(layer, image, [...items, ...(draft ? [draft] : [])])
  }

  function changed() {
    render()
    updateControls()
    const source = key
    const savedGeneration = generation
    const savedRevision = ++revision
    const snapshot = items
    status.textContent = '正在保存…'
    queue = queue.catch(() => undefined).then(() => writeImageAnnotations(source, snapshot))
      .then(() => { if (generation === savedGeneration && revision === savedRevision) status.textContent = '已保存到本机' })
      .catch(() => { if (generation === savedGeneration && revision === savedRevision) status.textContent = '本地保存失败，批注暂留本次会话' })
  }

  function replace(next: ImageAnnotation[]) {
    undo.push(items)
    if (undo.length > 100) undo.shift()
    redo = []
    items = next
    changed()
  }

  function hasRoom() {
    if (items.length < MAX_IMAGE_ANNOTATIONS) return true
    status.textContent = '这张图片的批注已满，请先清理部分批注'
    return false
  }

  function position(event: PointerEvent): AnnotationPoint {
    const rect = layer.getBoundingClientRect()
    const clamp = (value: number) => Math.min(1, Math.max(0, value))
    return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) }
  }

  function finishStroke(cancel = false) {
    const stroke = draft
    draft = null
    if (pointer !== null) {
      try { layer.releasePointerCapture(pointer) } catch { /* Already released. */ }
    }
    pointer = null
    if (stroke && !cancel) replace([...items, stroke])
    else render()
  }

  function commitText() {
    const point = textPosition
    textPosition = null
    textEditor.hidden = true
    const text = textarea.value.trim()
    if (!point || !text || !hasRoom()) return
    replace([...items, { id: crypto.randomUUID(), kind: 'text', color, ...point,
      text, size: (14 + size * 2) / Math.max(layer.getBoundingClientRect().width, 1) }])
  }

  function cancelDraft() {
    finishStroke(true)
    textPosition = null
    textEditor.hidden = true
  }

  function setEnabled(value: boolean) {
    finishStroke()
    commitText()
    enabled = value
    updateControls()
    onModeChange()
  }

  layer.addEventListener('pointerdown', (event) => {
    if (!enabled || !ready || tool === 'pan' || pointer !== null || event.button !== 0 || !hasRoom()) return
    event.preventDefault()
    commitText()
    if (!hasRoom()) return
    const point = position(event)
    if (tool === 'text') {
      textPosition = point
      textarea.value = ''
      textEditor.hidden = false
      textEditor.style.left = `${Math.max(12, Math.min(event.clientX, window.innerWidth - textEditor.offsetWidth - 12))}px`
      textEditor.style.top = `${Math.max(70, Math.min(event.clientY, window.innerHeight - toolbar.offsetHeight - textEditor.offsetHeight - 40))}px`
      textarea.focus()
      return
    }
    pointer = event.pointerId
    layer.setPointerCapture(pointer)
    draft = { id: crypto.randomUUID(), kind: tool, color,
      width: (tool === 'highlighter' ? size * 5 : size) / Math.max(layer.getBoundingClientRect().width, 1), points: [point] }
    render()
  })
  layer.addEventListener('pointermove', (event) => {
    if (!draft || event.pointerId !== pointer) return
    const samples = event.getCoalescedEvents?.() || []
    for (const sample of samples.length ? samples : [event]) {
      if (draft.points.length >= MAX_STROKE_POINTS) break
      const point = position(sample)
      const last = draft.points.at(-1)!
      if (Math.hypot(point.x - last.x, point.y - last.y) >= 0.0005) draft.points.push(point)
    }
    render()
  })
  layer.addEventListener('pointerup', (event) => { if (event.pointerId === pointer) finishStroke() })
  layer.addEventListener('pointercancel', () => finishStroke(true))
  image.addEventListener('load', render)

  return {
    allowsPan: () => !enabled || tool === 'pan',
    isDrawing: () => pointer !== null,
    async setImage(src: string) {
      finishStroke()
      commitText()
      const version = ++generation
      key = annotationImageKey(src)
      ready = false
      items = []
      undo = []
      redo = []
      status.textContent = '正在读取本机批注…'
      render()
      updateControls()
      const source = key
      await queue
      try {
        const saved = await readImageAnnotations(source)
        if (version !== generation) return
        items = saved
        status.textContent = imageAnnotationsAreTemporary(source)
          ? '本地保存失败，批注暂留本次会话' : '批注仅保存在当前浏览器'
      } catch {
        if (version !== generation) return
        items = cachedImageAnnotations(source)
        status.textContent = '本地存储不可用，批注暂留本次会话'
      }
      ready = true
      render()
      updateControls()
    },
    close() {
      setEnabled(false)
      generation += 1
      cancelDraft()
    },
    handleKeydown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.key === 'Escape' && textPosition) {
          event.preventDefault(); textPosition = null; textEditor.hidden = true; toggle.focus()
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault(); commitText()
        }
        return true
      }
      if (enabled && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        ;(event.shiftKey ? redoButton : undoButton).click()
        return true
      }
      return false
    },
  }
}
