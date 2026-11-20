/** Keep each array's inferred union bounded as the screenshot gallery grows. */
export function createCaptureDataModule(assets) {
  const groups = []
  for (let i = 0; i < assets.length; i += 200) groups.push(assets.slice(i, i + 200))
  return `import type { CaptureAsset } from '../../types/content'\n\nconst captureAssetGroups: CaptureAsset[][] = ${JSON.stringify(groups, null, 2)}\n\nexport const generatedCaptureAssets: CaptureAsset[] = captureAssetGroups.flat()\n\nexport default generatedCaptureAssets\n`
}

export function parseCaptureDataModule(raw) {
  const groups = raw.match(/const captureAssetGroups: CaptureAsset\[\]\[\] = (\[[\s\S]*?\r?\n\]|\[\])(?:\r?\n|$)/)
  if (groups) return JSON.parse(groups[1]).flat()
  // Existing checkouts and templates still use the original single-array format.
  const legacy = raw.match(/export const generatedCaptureAssets: CaptureAsset\[\] = (\[[\s\S]*?\r?\n\]|\[\])(?: as CaptureAsset\[\])?(?:\r?\n|$)/)
  return legacy ? JSON.parse(legacy[1]) : []
}
