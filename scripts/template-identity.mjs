import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const identityPath = path.join(root, 'src', 'data', 'site', 'template-identity.json')

export const templateIdentity = Object.freeze(JSON.parse(fs.readFileSync(identityPath, 'utf8')))

export default templateIdentity
