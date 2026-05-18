import { useEffect, useState } from "react"
import "./App.css"

export default function App() {
  const [enabled, setEnabled] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gemini-2.5-flash-lite")
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  // Load configuration from local storage
  useEffect(() => {
    chrome.storage.local.get(["enabled", "apiKey", "model"], (result) => {
      setEnabled(
        result.enabled !== undefined && result.enabled !== null
          ? !!result.enabled
          : false
      )
      if (result.apiKey !== undefined && result.apiKey !== null)
        setApiKey(String(result.apiKey))
      setModel(
        result.model !== undefined && result.model !== null
          ? String(result.model)
          : "gemini-2.5-flash-lite"
      )
    })
  }, [])

  const handleToggleChange = (newVal: boolean) => {
    if (newVal && !apiKey.trim()) {
      setAlertMessage(
        "Gemini API key is required to enable typing intelligence!"
      )
      setTimeout(() => setAlertMessage(""), 4000)
      return
    }
    setEnabled(newVal)
  }

  const handleSave = () => {
    const finalEnabled = apiKey.trim() ? enabled : false
    if (!apiKey.trim() && enabled) {
      setEnabled(false)
    }
    chrome.storage.local.set({ enabled: finalEnabled, apiKey, model }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="header">
        <div className="logo-wrapper">
          <svg
            className="logo-icon"
            width="22"
            height="22"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="#4f46e5">
              <path d="m35.8177 36.8043c-.5005 1.0368-1.5503 1.6957-2.7016 1.6957h-16.3076c-2.2193 0-3.6703-2.3261-2.6944-4.3193l11.2624-23c.5037-1.0286 1.5491-1.6807 2.6944-1.6807h16.1486c2.212 0 3.6633 2.3122 2.7017 4.3042z" />
              <path
                d="m6.87054 26.7399c1.05114 2.3025 4.30556 2.3487 5.42166.077l6.3838-12.9941c.9793-1.9934-.4716-4.3228-2.6926-4.3228h-12.31585c-2.18399 0-3.6360556 2.2591-2.729061 4.2459z"
                opacity=".5"
              />
            </g>
          </svg>
          <span className="logo-text">Verbo AI</span>
        </div>
        <div className={`status-badge ${enabled ? "" : "inactive"}`}>
          {enabled ? "Active" : "Disabled"}
        </div>
      </header>

      {/* Inline Warning Alert */}
      {alertMessage && (
        <div className="alert-box">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {alertMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="content">
        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-title">Typing Intelligence</span>
            <span className="setting-desc">
              Enable autocompletions on web pages
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggleChange(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* API Key */}
        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="apiKey"
              placeholder="Enter provider API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              <svg
                className="eye-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="form-group">
          <label htmlFor="modelSelect">AI Model</label>
          <select
            id="modelSelect"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <optgroup label="Gemini 3 (Latest)">
              <option value="gemini-3.1-pro-preview">
                gemini-3.1-pro (Preview)
              </option>
              <option value="gemini-3-flash-preview">
                gemini-3-flash (Preview)
              </option>
              <option value="gemini-3.1-flash-lite">
                gemini-3.1-flash-lite (Stable)
              </option>
              <option value="gemini-3.1-flash-lite-preview">
                gemini-3.1-flash-lite (Preview)
              </option>
            </optgroup>
            <optgroup label="Gemini 2.5 (High Performance)">
              <option value="gemini-2.5-pro">gemini-2.5-pro (Stable)</option>
              <option value="gemini-2.5-flash">
                gemini-2.5-flash (Stable)
              </option>
              <option value="gemini-2.5-flash-lite">
                gemini-2.5-flash-lite (Stable)
              </option>
              <option value="gemini-2.5-flash-live-preview">
                gemini-2.5-flash-live (Preview)
              </option>
            </optgroup>
          </select>
        </div>

        {/* Save Button */}
        <button
          className={`save-btn ${saved ? "saved" : ""}`}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>{" "}
              Saved Successfully!
            </>
          ) : (
            <>
              <svg
                className="save-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>{" "}
              Save Settings
            </>
          )}
        </button>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-tip">
          💡 Press <kbd>Tab</kbd> to accept completions inline, or{" "}
          <kbd>Esc</kbd> to dismiss.
        </p>
      </footer>
    </div>
  )
}
