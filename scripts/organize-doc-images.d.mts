export type DocImageStatus =
  | 'moved'
  | 'unreferenced'
  | 'ambiguous'
  | 'already-organized'
  | 'unsupported'
  | 'outside-docs'
  | 'missing'
  | 'not-file'
  | 'changed-during-scan'

export interface MarkdownImageReference {
  kind: 'markdown' | 'html'
  markdownPath: string
  token: string
  start: number
  end: number
  suffix?: string
  resolvedPath: string | null
  content?: string
}

export interface OrganizeDocImageOptions {
  docsRoot?: string
}

export interface OrganizeDocImageResult {
  status: DocImageStatus
  sourcePath: string
  destinationPath?: string
  markdownPath?: string
  oldReference?: string
  newReference?: string
  references: MarkdownImageReference[]
}

export const SUPPORTED_IMAGE_EXTENSIONS: readonly string[]
export function samePath(firstPath: string, secondPath: string): boolean
export function isWithin(rootPath: string, filePath: string): boolean
export function isSupportedImage(filePath: string): boolean
export function migrateCaptureAssetImage<T extends { image?: unknown }>(
  assets: T[],
  sourceImage: string,
  destinationImage: string,
): T[]
export function collectMarkdownImageReferences(
  markdownPath: string,
  content: string,
): MarkdownImageReference[]
export function organizeDocImage(
  imagePath: string,
  options?: OrganizeDocImageOptions,
): OrganizeDocImageResult
