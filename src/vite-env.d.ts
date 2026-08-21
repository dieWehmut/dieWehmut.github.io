/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INFRA_PROBE_URL?: string
  readonly VITE_CODE_RUNNER_API_URL?: string
  readonly VITE_CODE_RUNNER_API_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
