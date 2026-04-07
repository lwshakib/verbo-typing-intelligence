import { uIOhook } from 'uiohook-napi';
import { EventEmitter } from 'events';

export class KeyHook extends EventEmitter {
  private debouncedTimer: NodeJS.Timeout | null = null;
  private debounceMs = 400; // Recommended 300-500ms

  constructor() {
    super();
  }

  start() {
    uIOhook.on('keydown', (e: any) => {
      // Keycodes: 15 = Tab, 1 = Esc
      this.handleKeyDown(e);
    });

    uIOhook.start();
    console.log('Global key hook started');
  }

  stop() {
    uIOhook.stop();
  }


  private handleKeyDown(e: any) {
    // Clear existing timer
    if (this.debouncedTimer) {
      clearTimeout(this.debouncedTimer);
    }

    // Tab key (keycode 15) for injection
    if (e.keycode === 15) {
      console.log('[Hook] Tab pressed (inject)');
      this.emit('tab-pressed');
      return;
    }

    // Escape key (keycode 1) to hide overlay
    if (e.keycode === 1) {
      console.log('[Hook] Esc pressed (hide)');
      this.emit('esc-pressed');
      return;
    }

    // Debounce typing events
    this.debouncedTimer = setTimeout(() => {
      console.log('[Hook] Typing paused - emitting trigger');
      this.emit('typing-paused');
    }, this.debounceMs);
  }
}

export const keyHook = new KeyHook();
