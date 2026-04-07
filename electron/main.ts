import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { keyHook } from './hook'
import { uia } from './uia'
import { getAISuggestions } from '../src/services/ai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let overlayWin: BrowserWindow | null = null
let lastSuggestion: string = ''
let hideTimeout: NodeJS.Timeout | null = null
let lastProcessName: string = ''
let currentAbortController: AbortController | null = null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createOverlayWindow() {
  overlayWin = new BrowserWindow({
    width: 600,
    height: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  overlayWin.setIgnoreMouseEvents(true, { forward: true })

  if (VITE_DEV_SERVER_URL) {
    overlayWin.loadURL(`${VITE_DEV_SERVER_URL}#/overlay`)
  } else {
    overlayWin.loadURL(`file://${path.join(RENDERER_DIST, 'index.html')}#/overlay`)
  }
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  createOverlayWindow()

  // Initialize UIA (COM runtime)
  uia.init()

  // Start global key hook
  keyHook.start()

  keyHook.on('typing-paused', async () => {
    console.log('[Main] Received typing-paused event');
    const context = await uia.getTextContext()
    
    // Auto-hide if focus changed
    if (context.processName !== lastProcessName && lastSuggestion) {
      console.log('[Main] Focus changed - hiding suggestion');
      lastSuggestion = ''
      overlayWin?.hide()
      overlayWin?.webContents.send('hide-suggestion')
    }
    lastProcessName = context.processName

    if (!context.fullText) {
      console.log('[Main] No text context found');
      return;
    }

    console.log('[Main] Requesting AI suggestions...');
    
    // Cancel any pending request
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    
    const { suggestion } = await getAISuggestions(context.fullText.slice(-100), currentAbortController.signal)
    
    if (!suggestion) {
      console.log('[Main] No suggestion received from AI');
      return;
    }

    console.log('[Main] Suggestion received:', suggestion);
    lastSuggestion = suggestion

    if (overlayWin) {
      // Clear existing timeout
      if (hideTimeout) clearTimeout(hideTimeout);
      
      if (context.caretRect) {
        console.log('[Main] Positioning ghost text at:', context.caretRect);
        overlayWin.setBounds({
          x: Math.round(context.caretRect.x + 2),
          y: Math.round(context.caretRect.y),
          width: 800,
          height: 100
        })
      }
      overlayWin.showInactive()
      overlayWin.webContents.send('show-suggestion', suggestion)

      // Set auto-hide timeout (8 seconds)
      hideTimeout = setTimeout(() => {
        if (lastSuggestion) {
          console.log('[Main] Idle timeout - hiding suggestion');
          lastSuggestion = ''
          overlayWin?.hide()
          overlayWin?.webContents.send('hide-suggestion')
        }
      }, 8000);
    }
  })

  keyHook.on('keypress', (e: any) => {
    // Hide overlay immediately on any key except Tab (15) or Esc (1)
    if (e.keycode !== 15 && e.keycode !== 1 && lastSuggestion) {
      console.log('[Main] Typing resumed - hiding ghost text');
      lastSuggestion = ''
      if (hideTimeout) clearTimeout(hideTimeout);
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      overlayWin?.hide()
      overlayWin?.webContents.send('hide-suggestion')
    }
  })

  keyHook.on('tab-pressed', async () => {
    console.log('[Main] Received tab-pressed event');
    if (lastSuggestion) {
      console.log('[Main] Injecting suggestion:', lastSuggestion);
      await uia.injectText(lastSuggestion)
      lastSuggestion = ''
      overlayWin?.hide()
      overlayWin?.webContents.send('hide-suggestion')
    }
  })

  keyHook.on('esc-pressed', () => {
    console.log('[Main] Received esc-pressed event');
    lastSuggestion = ''
    overlayWin?.hide()
    overlayWin?.webContents.send('hide-suggestion')
  })
})

app.on('will-quit', () => {
  keyHook.stop()
  uia.cleanup()
})
