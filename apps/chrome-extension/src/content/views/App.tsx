import { useEffect, useState, useRef } from 'react'
import './App.css'

export default function App() {
  const [suggestion, setSuggestion] = useState('')
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [isEnabled, setIsEnabled] = useState(false)
  const activeElRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement | null>(null)
  const debounceTimerRef = useRef<any>(null)
  const DEBOUNCE_MS = 500

  useEffect(() => {
    chrome.storage.local.get(['enabled'], (result) => {
      setIsEnabled(result.enabled !== undefined ? !!result.enabled : false)
    })

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.enabled !== undefined) {
        setIsEnabled(!!changes.enabled.newValue)
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  useEffect(() => {
    // Intercept input changes
    const handleInput = (e: Event) => {
      if (!isEnabled) return
      const target = e.target as HTMLElement
      if (!isTargetable(target)) return

      activeElRef.current = target
      setSuggestion('')

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      const text = getCaretText(target)
      if (!text || text.trim().length < 3) return

      debounceTimerRef.current = setTimeout(() => {
        requestSuggestion(text)
      }, DEBOUNCE_MS)
    }

    // Intercept keys for Tab and Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled) return
      if (!suggestion || !activeElRef.current) return

      if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        acceptSuggestion()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setSuggestion('')
      } else {
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
      // Small timeout to handle click selections if any
      setTimeout(() => {
        if (activeElRef.current === e.target) {
          setSuggestion('')
          activeElRef.current = null
        }
      }, 150)
    }

    const handleScrollOrResize = () => {
      updatePosition()
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
  }, [suggestion, isEnabled])

  // Reposition suggestion when typing/focus triggers it
  useEffect(() => {
    if (suggestion) {
      updatePosition()
    }
  }, [suggestion])

  const requestSuggestion = (text: string) => {
    chrome.runtime.sendMessage({ action: 'getAISuggestion', text }, (response) => {
      if (!activeElRef.current) return

      if (response && response.suggestion && response.suggestion.trim().length > 0) {
        setSuggestion(response.suggestion)
      } else {
        setSuggestion('')
      }
    })
  }

  const updatePosition = () => {
    if (!activeElRef.current) return
    const rect = activeElRef.current.getBoundingClientRect()
    
    // Position 6px directly below the input element
    const top = rect.bottom + window.scrollY + 6
    let left = rect.left + window.scrollX

    // Boundary check
    const pillWidth = 150
    const viewportWidth = window.innerWidth
    if (left + pillWidth > viewportWidth + window.scrollX - 16) {
      left = viewportWidth + window.scrollX - pillWidth - 16
    }
    if (left < window.scrollX + 16) {
      left = window.scrollX + 16
    }

    setCoords({ top, left })
  }

  const acceptSuggestion = () => {
    const el = activeElRef.current
    if (!el || !suggestion) return

    const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'

    if (isInput) {
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement
      const start = inputEl.selectionStart ?? 0
      const end = inputEl.selectionEnd ?? 0
      const val = inputEl.value
      const before = val.substring(0, start)
      const after = val.substring(end)

      inputEl.value = before + suggestion + after
      
      const newCursorPos = start + suggestion.length
      inputEl.selectionStart = inputEl.selectionEnd = newCursorPos

      // Dispatch standard input event so frameworks (React, Vue) pick up the value updates
      inputEl.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      // ContentEditable support
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const node = document.createTextNode(suggestion)
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
    const isContentEditable = el.contentEditable === 'true'
    return (isInput || isTextarea || isContentEditable) && !(el as any).readOnly && !(el as any).disabled
  }

  const getCaretText = (el: HTMLElement) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const start = (el as HTMLInputElement).selectionStart ?? 0
      return (el as HTMLInputElement).value.substring(0, start)
    }
    return el.innerText
  }

  if (!suggestion) return null

  return (
    <div 
      className="verbo-suggestion-pill"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        zIndex: 999999,
        pointerEvents: 'none'
      }}
    >
      <span className="verbo-ghost">...</span>
      <span className="verbo-text">{suggestion}</span>
      <span className="verbo-badge">TAB</span>
    </div>
  )
}
