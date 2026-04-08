import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import { keyHook } from './hook'
import { uia } from './uia'
import { getAISuggestions } from '../src/services/ai'

const store = new Store();

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

// Platform-specific icon paths
const getIconPath = (): string => {
  const platform = process.platform;
  const basePath = process.env.VITE_PUBLIC ?? process.env.APP_ROOT;

  switch (platform) {
    case 'win32':
      return path.join(basePath, 'icons', 'win', 'icon.ico');
    case 'darwin':
      return path.join(basePath, 'icons', 'mac', 'icon.icns');
    default:
      return path.join(basePath, 'icons', 'png', '256x256.png');
  }
};

const iconPath = getIconPath();

let win: BrowserWindow | null = null
let overlayWin: BrowserWindow | null = null
let lastSuggestion: string = ''
let hideTimeout: NodeJS.Timeout | null = null
let lastProcessName: string = ''
let currentAbortController: AbortController | null = null
let suggestionHistory: any[] = []
let activeContextStr: string = '' // Context at the time suggestion was generated
let tray: Tray | null = null; // Prevent garbage collection

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: false,
    maximizable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    icon: iconPath,
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
  if (process.platform === 'win32') {
    // Ensures proper taskbar grouping/icon behavior on Windows.
    app.setAppUserModelId('com.verbo.typingintelligence')
  }

  createWindow()
  createOverlayWindow()

  // Initialize UIA (COM runtime)
  uia.init()

  // Start global key hook
  keyHook.start()
  const processingEnabled = store.get('processingEnabled', true) as boolean;
  const initialApiKey = store.get('apiKey') as string;
  const initialModel = store.get('model') as string;
  keyHook.setEnabled(processingEnabled && !!initialApiKey && !!initialModel);

  // Set up Tray
  let trayIconPath = iconPath;
  try {
    tray = new Tray(trayIconPath);
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Configurations', 
        icon: path.join(process.env.VITE_PUBLIC, 'icons/png/16x16.png'),
        click: () => win?.show() 
      },
      { type: 'separator' },
      { 
        label: 'Quit Verbo', 
        icon: path.join(process.env.VITE_PUBLIC, 'icons/png/16x16.png'),
        click: () => { app.quit() } 
      }
    ])
    tray.setToolTip('Verbo Typing Intelligence')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      tray?.popUpContextMenu();
    })
  } catch (err) {
    console.error('[Main] Failed to initialize Tray icon:', err);
  }

  keyHook.on('typing-paused', async () => {
    console.log('[Main] Received typing-paused event');
    const context = await uia.getTextContext()
    
    // Auto-hide if focus changed or context is empty
    const isFocusChanged = context.processName !== lastProcessName;
    const isTextEmpty = !context.fullText;

    if ((isFocusChanged || isTextEmpty) && lastSuggestion) {
      console.log('[Main] Focus changed or empty text - hiding suggestion');
      lastSuggestion = ''
      if (currentAbortController) currentAbortController.abort();
      overlayWin?.hide()
      overlayWin?.webContents.send('hide-suggestion')
    }
    
    lastProcessName = context.processName

    if (isTextEmpty) {
      console.log('[Main] No text context found or field is empty');
      return;
    }

    console.log('[Main] Requesting AI suggestions...');
    
    // Cancel any pending request
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    
    // Increased context window to 500 for better "broad" understanding
    activeContextStr = context.fullText.slice(-500);
    
    const config = {
      apiKey: store.get('apiKey') as string,
      model: store.get('model') as string || 'gemini-3.1-flash-lite-preview'
    };

    if (!config.apiKey) {
      console.log('[Main] No API key configured. Skipping AI request.');
      return;
    }

    const { suggestion } = await getAISuggestions(
      activeContextStr, 
      currentAbortController.signal,
      suggestionHistory,
      '',
      config
    )
    
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
      
      // Record implicit rejection (user typed over it)
      suggestionHistory.push({ context: activeContextStr, suggestion: lastSuggestion, accepted: false });
      if (suggestionHistory.length > 10) suggestionHistory.shift();

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
      // Smart Spacing: Ensure there's a space if we're between two words and no space exists
      const context = await uia.getTextContext();
      let finalSuggestion = lastSuggestion;
      
      const lastChar = context.fullText?.slice(-1);
      const firstCharSuggestion = lastSuggestion[0];
      
      // If last char is a letter/digit and first suggestion char is a letter/digit, and there's no space...
      if (lastChar && firstCharSuggestion && 
          /[a-zA-Z0-9]/.test(lastChar) && 
          /[a-zA-Z0-9]/.test(firstCharSuggestion)) {
        console.log('[Main] Smart Spacing: Adding leading space');
        finalSuggestion = ' ' + lastSuggestion;
      }

      console.log('[Main] Injecting suggestion (with 10ms safety delay):', finalSuggestion);
      
      // Record acceptance in history
      suggestionHistory.push({ context: activeContextStr, suggestion: lastSuggestion, accepted: true });
      if (suggestionHistory.length > 10) suggestionHistory.shift();
      
      // Defensive delay: Wait for the target app to process its own Tab event
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await uia.injectText(finalSuggestion)
      lastSuggestion = ''
      overlayWin?.hide()
      overlayWin?.webContents.send('hide-suggestion')
    }
  })

  keyHook.on('esc-pressed', () => {
    console.log('[Main] Received esc-pressed event');
    if (lastSuggestion) {
      suggestionHistory.push({ context: activeContextStr, suggestion: lastSuggestion, accepted: false });
      if (suggestionHistory.length > 10) suggestionHistory.shift();
    }
    lastSuggestion = ''
    overlayWin?.hide()
    overlayWin?.webContents.send('hide-suggestion')
  })

  keyHook.on('mousedown', () => {
    if (lastSuggestion || currentAbortController) {
      console.log('[Main] Mouse click detected - hiding ghost text and aborting AI');
      lastSuggestion = ''
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      overlayWin?.hide()
      overlayWin?.webContents.send('hide-suggestion')
    }
  })

  // Window Controls
  ipcMain.on('window-minimize', () => win?.minimize())
  ipcMain.on('window-maximize', () => {
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })
  ipcMain.on('window-close', () => win?.hide())

  // Config Management
  ipcMain.on('save-config', (_, { apiKey, model, processingEnabled }) => {
    store.set('apiKey', apiKey)
    store.set('model', model)
    if (processingEnabled !== undefined) {
      store.set('processingEnabled', processingEnabled)
    }
    
    // Evaluate if hook should be enabled
    const currentApiKey = store.get('apiKey') as string;
    const currentModel = store.get('model') as string;
    const currentEnabled = store.get('processingEnabled', true) as boolean;
    const shouldRun = Boolean(currentEnabled && currentApiKey && currentModel);
    keyHook.setEnabled(shouldRun);

    console.log('[Main] Config saved:', { model, shouldRun })
  })

  ipcMain.handle('get-config', () => ({
    apiKey: store.get('apiKey'),
    model: store.get('model') || 'gemini-3.1-flash-lite-preview',
    processingEnabled: store.get('processingEnabled', true)
  }))
})

app.on('will-quit', () => {
  keyHook.stop()
  uia.cleanup()
})
