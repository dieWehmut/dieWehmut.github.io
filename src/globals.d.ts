export {}

declare global {
  interface Window {
    __centered_toast_app?: {
      app: { unmount: () => void }
      container: HTMLElement
    }
  }
}
