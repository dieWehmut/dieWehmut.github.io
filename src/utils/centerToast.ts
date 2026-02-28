import { createApp } from 'vue'
import CopyToast from '../components/CopyToast.vue'
import i18n from '../i18n'

export function showCenteredToast(messageOrKey, { type = 'success', duration = 2500 } = {}) {
  try {
    // resolve translation key if it exists in i18n
    let text = messageOrKey
    try {
      if (typeof messageOrKey === 'string' && i18n && i18n.global && i18n.global.te(messageOrKey)) {
        text = i18n.global.t(messageOrKey)
      }
    } catch (e) {
      // ignore translation errors and use raw message
    }

    // remove previous toast if present
    try {
      if (window.__centered_toast_app) {
        try { window.__centered_toast_app.app.unmount() } catch(e) {}
        try { window.__centered_toast_app.container.remove() } catch(e) {}
        delete window.__centered_toast_app
      }
    } catch (e) {}

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
        } catch (e) {}
        try { container.remove() } catch (e) {}
        try { delete window.__centered_toast_app } catch (e) {}
      }
    })
    app.use(i18n)
    app.mount(container)

    // keep reference so subsequent toasts can clear previous
    window.__centered_toast_app = { app, container }
  } catch (e) {
    console.error('showCenteredToast error', e)
  }
}

export default showCenteredToast
