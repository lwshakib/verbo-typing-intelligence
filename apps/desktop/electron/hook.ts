import { uIOhook } from 'uiohook-napi';
import { EventEmitter } from 'events';

export class KeyHook extends EventEmitter {
  private enabled = true;
  private debouncedTimer: NodeJS.Timeout | null = null;
  private debounceMs = 1000; // 1 second as requested by user

  constructor() {
    super();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.debouncedTimer) {
      clearTimeout(this.debouncedTimer);
      this.debouncedTimer = null;
    }
  }

  start() {
    uIOhook.on('keydown', (e: Record<string, unknown>) => {
      if (!this.enabled) return;
      this.handleKeyDown(e);
    });

    uIOhook.on('mousedown', (e: Record<string, unknown>) => {
      if (!this.enabled) return;
      this.emit('mousedown', e);
    });

    uIOhook.start();
    console.log('Global key hook started');
  }

  stop() {
    uIOhook.stop();
  }

  private handleKeyDown(e: Record<string, unknown>) {
    // Emit event immediately for auto-hiding
    this.emit('keypress', e);

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
