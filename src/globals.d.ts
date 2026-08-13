export {}

declare module 'pdfmake/build/pdfmake' {
  import type { TDocumentDefinitions } from 'pdfmake/interfaces'
  import type { TCreatedPdf, TFontDictionary, TVirtualFileSystem } from 'pdfmake'

  const pdfMake: {
    createPdf: (
      documentDefinitions: TDocumentDefinitions,
      options?: Record<string, unknown>
    ) => TCreatedPdf
    fonts: TFontDictionary
    vfs?: TVirtualFileSystem
    addVirtualFileSystem: (vfs: TVirtualFileSystem) => void
  }
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  import type { TVirtualFileSystem } from 'pdfmake'

  const vfs: TVirtualFileSystem
  export default vfs
}

declare global {
  interface Window {
    __centered_toast_app?: {
      app: { unmount: () => void }
      container: HTMLElement
    }
  }
}
