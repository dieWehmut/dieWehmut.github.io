export const POINTER_EFFECTS_RESET_EVENT = 'nexus:pointer-effects-reset'

export function resetPointerEffects(target?: Window): void {
  const owner = target || (typeof window !== 'undefined' ? window : null)
  owner?.dispatchEvent(new Event(POINTER_EFFECTS_RESET_EVENT))
}
