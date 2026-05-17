/// <reference types="vite/client" />

declare global {
  interface Window {
    electron?: {
      minimize: () => void
      maximize: () => void
      close: () => void
      saveConfig: (config: { apiKey: string; model: string; processingEnabled?: boolean }) => void
      getConfig: () => Promise<any>
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      off: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}

export {}
