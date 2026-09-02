const SUBGRAPH_DECLARATION = /^(\s*subgraph\s+)(.+?)(\s*)$/gim

/**
 * Quote Mermaid subgraph titles containing parser-significant punctuation.
 * @param {string} source
 * @returns {string}
 */
export function normalizeMermaidSource(source) {
  return source.replace(SUBGRAPH_DECLARATION, (line, prefix, title, suffix) => {
    const trimmed = title.trim()
    if (!/[()]/.test(trimmed) || /^['"`]/.test(trimmed) || trimmed.includes('[')) {
      return line
    }

    const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `${prefix}"${escaped}"${suffix}`
  })
}
