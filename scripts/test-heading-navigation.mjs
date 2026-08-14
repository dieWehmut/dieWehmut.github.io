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
}

if (failures.length) {
  failures.forEach((failure) => console.log(`FAIL ${failure}`))
  process.exitCode = 1
} else {
  console.log('PASS heading navigation pure helpers')
}
