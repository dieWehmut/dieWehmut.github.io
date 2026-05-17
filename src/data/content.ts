import { pages } from './page'
import { games } from './game'
import { apps } from './app'
import { files } from './file'
import { tools } from './tool'
import { services } from './service'

export function useContent() {
  return { pages, games, apps, files, tools, services }
}
