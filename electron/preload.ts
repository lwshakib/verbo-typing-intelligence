import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electron', {
  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Config Management
  saveConfig: (config: { apiKey: string, model: string, processingEnabled?: boolean }) => ipcRenderer.send('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),

  // IPC communication for data
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => 
    ipcRenderer.on(channel, listener),
  off: (channel: string, listener: (event: any, ...args: any[]) => void) => 
    ipcRenderer.off(channel, listener),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
})
