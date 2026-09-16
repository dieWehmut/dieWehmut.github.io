/**
 * Contents-page anchor placement for pdfmake headings.
 *
 * pdfmake resolves a `pageReference` only against an `id` registered on a text
 * node. A heading that mixes prose with an inline formula or image is emitted as
 * a stack, and an `id` on that stack is silently ignored; pdfmake then aborts
 * the whole export with "Page reference id not found". Attaching the anchor to a
 * text segment keeps the page number resolvable, and a heading made of math or
 * images alone gets an empty text segment purely to carry it.
 */

/**
 * @param {unknown[]} segments
 * @param {string} anchorId
 * @returns {unknown[]}
 */
export function attachHeadingAnchor(segments, anchorId) {
  const index = segments.findIndex((segment) =>
    segment !== null && typeof segment === 'object' && !Array.isArray(segment) && 'text' in segment
  )
  if (index === -1) return [{ text: '', id: anchorId }, ...segments]

  const anchored = segments.slice()
  anchored[index] = { ...anchored[index], id: anchorId }
  return anchored
}