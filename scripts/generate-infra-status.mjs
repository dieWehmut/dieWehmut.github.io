import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createInfraStatusSnapshot,
  readInfraUrls,
  writeInfraStatusSnapshot,
} from './infra-status-snapshot.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'src', 'data', 'site', 'infra.ts')
const outputPath = path.join(root, 'public', 'infra-status.json')
const snapshot = await createInfraStatusSnapshot(readInfraUrls(sourcePath))
writeInfraStatusSnapshot(outputPath, snapshot)
console.log(`Wrote ${Object.keys(snapshot.statuses).length} Infra statuses to ${outputPath}`)
