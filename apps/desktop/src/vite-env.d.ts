/// <reference types="vite/client" />

declare global {
  interface Window {
    electron?: {
      minimize: () => void
      maximize: () => void
      close: () => void
      saveConfig: (config: { apiKey: string; model: string; processingEnabled?: boolean; startOnStartup?: boolean }) => void
      getConfig: () => Promise<Record<string, unknown>>
      on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
      off: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}

export {}
