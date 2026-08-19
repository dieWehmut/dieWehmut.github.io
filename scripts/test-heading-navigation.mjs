import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const helperPath = path.join(root, 'src/utils/headingNavigation.ts')
const failures = []

if (!fs.existsSync(helperPath)) {
  failures.push('heading navigation helper is missing')
} else {
  const source = fs.readFileSync(helperPath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: helperPath,
  })
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  const helper = await import(moduleUrl)
  const title = '\u4e00\u3001\u65f6\u4ee3\u53d8\u4e86\uff0c\u4f46\u95ee\u9898\u6ca1\u53d8\uff1a\u5982\u4f55\u627e\u5230\u81ea\u5df1\u4eba\u751f\u7684\u89e3\u6cd5\uff1f'
  const expected = '\u4e00\u65f6\u4ee3\u53d8\u4e86\u4f46\u95ee\u9898\u6ca1\u53d8\u5982\u4f55\u627e\u5230\u81ea\u5df1\u4eba\u751f\u7684\u89e3\u6cd5'

  if (helper.slugifyHeadingText(title) !== expected) {
    failures.push('Chinese punctuation heading slug is stable')
  }
  if (helper.decodeHeadingHash(`#${encodeURIComponent(title)}`) !== title) {
    failures.push('encoded hash is decoded safely')
  }
  if (helper.decodeHeadingHash('#bad%2') !== 'bad%2') {
    failures.push('malformed hash does not throw')
  }
  const registry = new Map()
  if (helper.getUniqueHeadingId(expected, registry) !== expected || helper.getUniqueHeadingId(expected, registry) !== `${expected}-2`) {
    failures.push('duplicate heading ids receive stable suffixes')
  }
  if (helper.normalizeHeadingText('  Example   Heading ') !== 'example heading') {
    failures.push('heading text matching normalizes whitespace')
  }
  const quotedTitle = '\u4e8c\u3001\u4e8b\u60c5\u7167\u505a\u3001\u60c5\u7eea\u7f3a\u5e2d:\u8c01\u5077\u8d70\u4e86\u6211\u4eec\u7684"\u6d3b\u4eba\u611f"?'
  const encodedTitle = quotedTitle.replaceAll('"', '&quot;')
  if (helper.plainHeadingText(encodedTitle) !== quotedTitle || helper.slugifyHeadingText(encodedTitle).includes('quot')) {
    failures.push('heading entities decode before titles and slugs are generated')
  }
  if (helper.decodeHtmlEntities('javascript&colon;alert&lpar;1&rpar;') !== 'javascript:alert&lpar;1&rpar;') {
    failures.push('URL-significant entities decode before sanitizer checks')
  }
  const heading = {
    id: expected,
    dataset: { mdHeadingTitle: title },
    getAttribute: () => null,
    textContent: title,
  }
  const rootNode = { querySelectorAll: () => [heading] }
  if (helper.resolveHeading(rootNode, `#${encodeURIComponent(title)}`) !== heading) {
    failures.push('encoded raw title resolves to its canonical heading')
  }

  // Measured off a real article. `scrollHeadingIntoView` aimed at
  // 1338.6328125 - 120 and the browser parked the page at 1218.5, leaving the
  // heading it had just scrolled to 0.13px below the offset line. Read without a
  // tolerance that heading never becomes the active one, and a row that steps
  // from the active heading then re-targets the position the page is already
  // parked at: a scroll of nothing, so no scroll event, so no new reading, so
  // the arrow keys stop answering for good.
  const tops = [681.6953125, 738.984375, 1338.6328125, 1949.78125]
  if (helper.activeHeadingIndex(tops, 1218.5, 120) !== 2) {
    failures.push('the heading just scrolled to reads as active despite sub-pixel rounding')
  }
  if (helper.activeHeadingIndex(tops, 0, 120) !== 0) {
    failures.push('the first heading is active before any of them reach the line')
  }
  if (helper.activeHeadingIndex(tops, 1949.78125 - 120, 120) !== 3) {
    failures.push('the last heading takes over once the page reaches it')
  }
  if (helper.activeHeadingIndex([], 0, 120) !== -1) {
    failures.push('an article with no headings has no active one')
  }
  // The tolerance answers a rounding error, so it has to stay far below the gap
  // between two headings — otherwise scrolling to one would activate the next.
  if (helper.activeHeadingIndex(tops, 738.984375 - 120, 120) !== 1) {
    failures.push('the tolerance never reaches as far as the next heading')
  }

  // Also measured off /post/Harness. The article's last heading sits 2433.53 into
  // the document; in a 900px-tall viewport the page runs out of scroll at 2230, so
  // no scroll position can ever bring that heading to the offset line. A row that
  // reads its selection back from the position therefore refuses to walk into the
  // heading, or to wrap past it, and reports "no response" exactly the way the
  // sub-pixel rounding above did.
  const article = [628.36, 685.65, 1285.3, 1896.45, 2022.23, 2227.88, 2433.53]
  const shortRange = 2230
  const fullRange = 2421
  if (helper.selectedHeadingIndex(article, shortRange, shortRange, 120, 6) !== 6) {
    failures.push('a heading past the end of the scroll range can still be selected')
  }
  if (helper.selectedHeadingIndex(article, 1219, shortRange, 120, -1)
    !== helper.activeHeadingIndex(article, 1219, 120)) {
    failures.push('with nothing pinned the selection is just the reading')
  }
  // A pin the page can reach needs no holding, so it must not be honoured: doing so
  // would freeze the selection at whatever was last clicked and stop it following
  // the page.
  if (helper.selectedHeadingIndex(article, 566, fullRange, 120, 6) !== 1) {
    failures.push('a pin the page can scroll to yields to the reading')
  }
  if (helper.selectedHeadingIndex(article, 1219, shortRange, 120, 5)
    !== helper.activeHeadingIndex(article, 1219, 120)) {
    failures.push('the last heading inside the scroll range is not treated as unreachable')
  }
}

if (failures.length) {
  failures.forEach((failure) => console.log(`FAIL ${failure}`))
  process.exitCode = 1
} else {
  console.log('PASS heading navigation pure helpers')
}
