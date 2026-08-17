import { readonly, ref } from 'vue'

export type ConsoleRevealKind = 'root' | 'route' | 'comment'

export interface ConsoleRevealRequest {
  id: number
  kind: ConsoleRevealKind
}

const revealRequest = ref<ConsoleRevealRequest>({ id: 0, kind: 'root' })

export function requestConsoleOutputReveal(kind: ConsoleRevealKind) {
  revealRequest.value = {
    id: revealRequest.value.id + 1,
    kind,
  }
}

export function useConsoleOutputReveal() {
  return { revealRequest: readonly(revealRequest) }
}
