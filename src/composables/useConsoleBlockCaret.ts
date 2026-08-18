import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/** Events after which the insertion point may have landed somewhere new. */
const CARET_EVENTS = ['input', 'keyup', 'pointerup', 'select', 'scroll', 'focus', 'blur'] as const

/**
 * A vim-style block caret for the console prompt.
 *
 * The browser's hairline caret is easy to lose in a monospace field, so it is
 * hidden and a block is drawn over the cell the insertion point rests on. Both
 * the offset and the width are measured from the input's own resolved font, so
 * the block cannot drift out of step with a font change and no font declaration
 * has to be repeated for it.
 *
 * Nothing here touches keys: the caret only ever reads where the browser and
 * the session have already put the selection. Measuring on the next frame is
 * what makes that reliable, because it runs after every microtask — including
 * the `setSelectionRange` that completing a suggestion performs a tick late.
 */
export function useConsoleBlockCaret(inputRef: Ref<HTMLInputElement | null>, value: Ref<string>) {
  /** The block belongs to insert mode, so it only shows while the field has focus. */
  const caretActive = ref(false)
  const caretOffset = ref(0)
  const caretWidth = ref(0)
  const caretGlyph = ref('')

  let measureContext: CanvasRenderingContext2D | null = null
  let frame = 0

  function textWidth(font: string, text: string) {
    if (!text) return 0
    measureContext ||= document.createElement('canvas').getContext('2d')
    if (!measureContext) return 0
    measureContext.font = font
    return measureContext.measureText(text).width
  }

  function measure() {
    frame = 0
    const input = inputRef.value
    if (!input) return

    caretActive.value = document.activeElement === input
    const styles = getComputedStyle(input)
    const font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
    // A backward selection is being dragged from its start, so that end is where
    // the caret actually sits; every other case ends at the selection's end.
    const caret = (input.selectionDirection === 'backward'
      ? input.selectionStart
      : input.selectionEnd) ?? input.value.length
    const glyph = input.value.slice(caret, caret + 1)

    caretGlyph.value = glyph
    // Past the last character there is no glyph to cover, but the cell still has
    // a width: in a monospace field a stand-in advance is the same as any other.
    caretWidth.value = textWidth(font, glyph || '0')
    // The first cell starts at the input's own content edge, which is where an
    // empty field wants the block — right where the leading `/` will be typed.
    caretOffset.value = parseFloat(styles.paddingLeft) + parseFloat(styles.borderLeftWidth)
      + textWidth(font, input.value.slice(0, caret))
      - input.scrollLeft
  }

  function schedule() {
    if (frame) return
    frame = requestAnimationFrame(measure)
  }

  watch(inputRef, (input, previous) => {
    CARET_EVENTS.forEach((event) => previous?.removeEventListener(event, schedule))
    CARET_EVENTS.forEach((event) => input?.addEventListener(event, schedule))
    schedule()
  }, { immediate: true })

  // History recall, Escape and a committed panel all rewrite the field without
  // an input event of their own, so the value is watched as well.
  watch(value, schedule)

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    CARET_EVENTS.forEach((event) => inputRef.value?.removeEventListener(event, schedule))
  })

  return { caretActive, caretOffset, caretWidth, caretGlyph }
}
