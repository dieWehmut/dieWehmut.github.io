export const CENTER_TOAST_EVENT = 'nexus:center-toast'

export function showCenteredToast(messageOrKey: string, options: { type?: string; duration?: number } = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(CENTER_TOAST_EVENT, {
      detail: {
        messageOrKey,
        type: options.type || 'success',
        duration: options.duration || 2500,
      },
    }),
  )
}
