/**
 * Math delimiter scanning shared by the Markdown renderer and its regression
 * tests.
 *
 * Display math is only recognized when its opening delimiter starts a line and
 * its closing delimiter ends a line. Without that rule a single stray `$$` in
 * prose re-pairs with the next delimiter and swallows every following
 * paragraph into one enormous "formula". That produced broken KaTeX on the
 * page and unusable MathJax input for PDF export.
 */

// An opening delimiter may only be preceded by indentation, blockquote markers
// or a list bullet on its line.
const BLOCK_PREFIX = /^[ \t]*(?:(?:>[ \t]*)|(?:(?:[-*+]|\d+[.)])[ \t]+))*$/
// A closing delimiter may only be followed by trailing whitespace and any
// remaining blockquote markers on its line.
const BLOCK_SUFFIX = /^[ \t]*\r?$/

/**
 * @param {string} source
 * @param {number} index
 * @returns {boolean}
 */
export function isDisplayMathOpeningBoundary(source, index) {
  const lineStart = source.lastIndexOf('\n', index - 1) + 1
  return BLOCK_PREFIX.test(source.slice(lineStart, index))
}

/**
 * @param {string} source
 * @param {number} index
 * @returns {boolean}
 */
export function isDisplayMathClosingBoundary(source, index) {
  const lineEnd = source.indexOf('\n', index)
  const rest = source.slice(index + 2, lineEnd === -1 ? source.length : lineEnd)
  return BLOCK_SUFFIX.test(rest)
}
