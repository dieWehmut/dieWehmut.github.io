import { createApp } from 'vue'
import CopyToast from '../components/system/CopyToast.vue'
import i18n from '../i18n'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  type?: ToastType
  duration?: number
}

export function showCenteredToast(
  messageOrKey: string,
  { type = 'success', duration = 2500 }: ToastOptions = {}
): void {
  try {
    let text = messageOrKey
    try {
      if (i18n?.global?.te(messageOrKey)) {
        text = String(i18n.global.t(messageOrKey))
      }
    } catch {}

    try {
      if (window.__centered_toast_app) {
        try {
          window.__centered_toast_app.app.unmount()
        } catch {}
        try {
          window.__centered_toast_app.container.remove()
        } catch {}
        delete window.__centered_toast_app
      }
    } catch {}

    const container = document.createElement('div')
    container.id = 'centered-toast'
    document.body.appendChild(container)

    const app = createApp(CopyToast, {
      text,
      type,
      duration,
      onClose: () => {
        try {
          app.unmount()
        } catch {}
        try {
          container.remove()
        } catch {}
        try {
          delete window.__centered_toast_app
        } catch {}
      },
    })

    app.use(i18n)
    app.mount(container)
    window.__centered_toast_app = { app, container }
  } catch (error) {
    console.error('showCenteredToast error', error)
  }
}

export default showCenteredToast
