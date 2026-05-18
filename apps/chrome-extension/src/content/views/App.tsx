import { useEffect, useState, useRef } from 'react'
import './App.css'

export default function App() {
  const [suggestion, _setSuggestion] = useState('')
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [isEnabled, setIsEnabled] = useState(false)
  
  const activeElRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement | null>(null)
  const suggestionRef = useRef(suggestion)
  const debounceTimerRef = useRef<any>(null)
  const DEBOUNCE_MS = 1000 // 1 second as requested by user

  const setSuggestion = (val: string) => {
    suggestionRef.current = val
    _setSuggestion(val)
  }

  useEffect(() => {
    try {
      chrome.storage.local.get(['enabled'], (result) => {
        if (chrome.runtime?.lastError) {
          console.warn('[Verbo CRX Content] Storage access error (Extension context invalidated):', chrome.runtime.lastError.message);
          return;
        }
        const enabled = result.enabled !== undefined ? !!result.enabled : false;
        console.log(`[Verbo CRX Content] Loaded initial config. Status: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        setIsEnabled(enabled);
      });

      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local' && changes.enabled !== undefined) {
          const newEnabled = !!changes.enabled.newValue;
          console.log(`[Verbo CRX Content] Config changed. Status updated to: ${newEnabled ? 'ENABLED' : 'DISABLED'}`);
          setIsEnabled(newEnabled);
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);

      return () => {
        try {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        } catch (e) {
          // Ignore cleanup errors on orphaned contexts
        }
      };
    } catch (err) {
      console.warn('[Verbo CRX Content] Extension context invalidated on load. Please refresh this tab.', err);
    }
  }, []);

  useEffect(() => {
    // Intercept input changes
    const handleInput = (e: Event) => {
      if (!isEnabled) return
      const target = e.target as HTMLElement
      if (!isTargetable(target)) return

      // Re-attach overlay container if website navigation unmounted it
      const rootEl = document.getElementById('verbo-typing-intelligence-root');
      if (rootEl && !document.body.contains(rootEl)) {
        console.log('[Verbo CRX Content] Re-attaching root container to document.body...');
        document.body.appendChild(rootEl);
      }

      activeElRef.current = target
      if (suggestionRef.current) {
        console.log('[Verbo CRX Content] User resumed typing. Hiding existing suggestion.');
        setSuggestion('')
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      const text = getCaretText(target)
      if (!text || text.trim().length < 3) return

      debounceTimerRef.current = setTimeout(() => {
        console.log(`[Verbo CRX Content] Typing paused for ${DEBOUNCE_MS}ms. Initiating AI completion request...`);
        requestSuggestion(text, target)
      }, DEBOUNCE_MS)
    }

    // Intercept keys for Tab and Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled) return
      const currentSuggestion = suggestionRef.current
      if (!currentSuggestion || !activeElRef.current) return

      if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        console.log(`[Verbo CRX Content] Keypress: Tab. Accepting AI suggestion: "${currentSuggestion}"`);
        acceptSuggestion()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        console.log('[Verbo CRX Content] Keypress: Escape. Dismissing AI suggestion.');
        setSuggestion('')
      }
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (isTargetable(target)) {
        activeElRef.current = target
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      // Extended timeout for complex SPAs (Notion/Docs) to avoid false blurs during internal DOM re-renders
      setTimeout(() => {
        if (activeElRef.current === e.target) {
          if (suggestionRef.current) {
            console.log('[Verbo CRX Content] Active element lost focus. Hiding suggestion.');
          }
          setSuggestion('')
          activeElRef.current = null
        }
      }, 500)
    }

    const handleScrollOrResize = () => {
      if (suggestionRef.current && activeElRef.current) {
        updatePosition()
      }
    }

    document.addEventListener('input', handleInput, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('focusout', handleFocusOut, true)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('input', handleInput, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('focusin', handleFocusIn, true)
      document.removeEventListener('focusout', handleFocusOut, true)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isEnabled])

  // Reposition suggestion when active
  useEffect(() => {
    if (suggestion) {
      updatePosition()
    }
  }, [suggestion])

  const requestSuggestion = (text: string, targetEl: HTMLElement) => {
    console.log(`[Verbo CRX Content] Dispatching message to background worker -> { action: 'getAISuggestion', text: "${text}" }`);
    try {
      chrome.runtime.sendMessage({ action: 'getAISuggestion', text }, (response) => {
        if (chrome.runtime?.lastError) {
          console.warn('[Verbo CRX Content] Connection error (Extension context invalidated. Please refresh this tab):', chrome.runtime.lastError.message);
          return;
        }

        let currentTarget = targetEl;
        if (!currentTarget || !document.contains(currentTarget)) {
          console.log('[Verbo CRX Content] Original target no longer in DOM. Inspecting document.activeElement...');
          if (document.activeElement && isTargetable(document.activeElement as HTMLElement)) {
            currentTarget = document.activeElement as HTMLElement;
          } else {
            console.log('[Verbo CRX Content] Active element is not targetable. Discarding suggestion.');
            return;
          }
        }

        if (response && response.error) {
          console.error('[Verbo CRX Content] Error returned from background AI worker:', response.error);
          setSuggestion('');
          return;
        }

        if (response && response.suggestion && response.suggestion.trim().length > 0) {
          console.log(`[Verbo CRX Content] Success! Rendering suggestion pill on UI: "${response.suggestion}"`);
          activeElRef.current = currentTarget; // Ensure active element reference is maintained
          updatePosition(currentTarget);
          setSuggestion(response.suggestion)
        } else {
          console.log('[Verbo CRX Content] AI returned empty continuation. Nothing to render.');
          setSuggestion('')
        }
      });
    } catch (err) {
      console.warn('[Verbo CRX Content] Failed to send message. Extension context invalidated. Please refresh this tab.', err);
    }
  }

  const getCaretCoordinates = (el: HTMLElement): { top: number; left: number } => {
    const elRect = el.getBoundingClientRect();
    
    // First try window selection range (flawless for contentEditable and complex SPAs like Notion)
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      if (rangeRect && (rangeRect.top !== 0 || rangeRect.left !== 0)) {
        return {
          top: rangeRect.top - 4, // Align vertically with caret
          left: rangeRect.right + 4 // Exactly 4px to the right of caret
        };
      }
    }

    // Fallback to element bottom-left
    return {
      top: elRect.bottom + 6,
      left: elRect.left
    };
  };

  const updatePosition = (elOverride?: HTMLElement) => {
    const target = elOverride || activeElRef.current;
    if (!target) return { top: 0, left: 0 };
    
    let { top, left } = getCaretCoordinates(target);

    // Boundary check within viewport
    const pillWidth = 150;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + pillWidth > viewportWidth - 16) {
      left = viewportWidth - pillWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }
    if (top > viewportHeight - 40) {
      top = viewportHeight - 40;
    }

    const newCoords = { top, left };
    setCoords(newCoords);
    return newCoords;
  };

  const acceptSuggestion = () => {
    const el = activeElRef.current
    const currentSuggestion = suggestionRef.current
    if (!el || !currentSuggestion) return

    const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'

    if (isInput) {
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement
      const start = inputEl.selectionStart ?? 0
      const end = inputEl.selectionEnd ?? 0
      const val = inputEl.value
      const before = val.substring(0, start)
      const after = val.substring(end)

      inputEl.value = before + currentSuggestion + after
      
      const newCursorPos = start + currentSuggestion.length
      inputEl.selectionStart = inputEl.selectionEnd = newCursorPos

      // Dispatch standard input event so frameworks (React, Vue) pick up the value updates
      inputEl.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      // ContentEditable support
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const node = document.createTextNode(currentSuggestion)
        range.insertNode(node)
        
        range.setStartAfter(node)
        range.setEndAfter(node)
        selection.removeAllRanges()
        selection.addRange(range)

        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    setSuggestion('')
  }

  const isTargetable = (el: HTMLElement) => {
    if (!el) return false
    const isInput = el.tagName === 'INPUT' && ((el as HTMLInputElement).type === 'text' || (el as HTMLInputElement).type === 'search' || !(el as HTMLInputElement).type)
    const isTextarea = el.tagName === 'TEXTAREA'
    const isContentEditable = el.contentEditable === 'true' || el.getAttribute('contenteditable') === 'true' || (el as any).isContentEditable
    return (isInput || isTextarea || isContentEditable) && !(el as any).readOnly && !(el as any).disabled
  }

  const getCaretText = (el: HTMLElement) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const start = (el as HTMLInputElement).selectionStart ?? 0
      return (el as HTMLInputElement).value.substring(0, start)
    }
    return el.innerText || el.textContent || ''
  }

  if (!suggestion) return null

  return (
    <div 
      className="verbo-suggestion-pill"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        zIndex: 2147483647,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 12px',
        borderRadius: '8px',
        background: 'rgba(15, 15, 15, 0.96)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        color: '#f8fafc',
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>...</span>
      <span style={{ color: '#a5b4fc', fontWeight: 600, textShadow: '0 0 10px rgba(99, 102, 241, 0.3)' }}>{suggestion}</span>
      <span style={{
        marginLeft: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '9px',
        color: '#94a3b8',
        background: 'rgba(255, 255, 255, 0.08)',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'monospace',
        fontWeight: 'bold'
      }}>TAB</span>
    </div>
  )
}
