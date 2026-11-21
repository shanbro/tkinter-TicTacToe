export type Phase = 'idle' | 'busy'

declare module 'claude-code' {
  interface PluginState {
    'prompt-polish': { phase: Phase; original: string | null }
  }
}
