import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import "./App.css"

function App() {
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gemini-2.5-flash-lite")
  const [processingEnabled, setProcessingEnabled] = useState(false)
  const [startOnStartup, setStartOnStartup] = useState(true)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )

  useEffect(() => {
    // Load initial config
    window.electron?.getConfig().then((config) => {
      if (config.apiKey && typeof config.apiKey === "string")
        setApiKey(config.apiKey)
      if (config.model && typeof config.model === "string")
        setModel(config.model)
      if (config.processingEnabled !== undefined)
        setProcessingEnabled(Boolean(config.processingEnabled))
      if (config.startOnStartup !== undefined)
        setStartOnStartup(Boolean(config.startOnStartup))
    })

    const handleUpdate = (_event: unknown, rawConfig: unknown) => {
      const config = rawConfig as Record<string, unknown>
      if (config?.apiKey !== undefined && typeof config.apiKey === "string")
        setApiKey(config.apiKey)
      if (config?.model !== undefined && typeof config.model === "string")
        setModel(config.model)
      if (config?.processingEnabled !== undefined)
        setProcessingEnabled(Boolean(config.processingEnabled))
      if (config?.startOnStartup !== undefined)
        setStartOnStartup(Boolean(config.startOnStartup))
    }

    window.electron?.on("config-updated", handleUpdate)

    return () => {
      window.electron?.off("config-updated", handleUpdate)
    }
  }, [])

  const handleSave = () => {
    setStatus("saving")
    try {
      const finalEnabled = apiKey.trim() ? processingEnabled : false
      if (!apiKey.trim() && processingEnabled) {
        setProcessingEnabled(false)
      }
      window.electron?.saveConfig({
        apiKey,
        model,
        processingEnabled: finalEnabled,
        startOnStartup,
      })
      setTimeout(() => setStatus("saved"), 500)
      setTimeout(() => setStatus("idle"), 3000)
    } catch (err) {
      console.error(err)
      setStatus("error")
    }
  }

  return (
    <div className="app-container">
      <main className="content">
        <section className="settings-card">
          <div className="card-header">
            <h2>Configuration</h2>
          </div>

          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="api-input"
            />
            <p className="hint">Works with your Google Gemini API key.</p>
          </div>

          <div className="form-group">
            <label>Model selection</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="model-select"
            >
              <optgroup label="Gemini 3 (Latest)">
                <option value="gemini-3.1-pro-preview">
                  Gemini 3.1 Pro (Preview)
                </option>
                <option value="gemini-3-flash-preview">
                  Gemini 3 Flash (Preview)
                </option>
                <option value="gemini-3.1-flash-lite">
                  Gemini 3.1 Flash-Lite (Stable)
                </option>
                <option value="gemini-3.1-flash-lite-preview">
                  Gemini 3.1 Flash-Lite (Preview)
                </option>
              </optgroup>
              <optgroup label="Gemini 2.5 (High Performance)">
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Stable)</option>
                <option value="gemini-2.5-flash">
                  Gemini 2.5 Flash (Stable)
                </option>
                <option value="gemini-2.5-flash-lite">
                  Gemini 2.5 Flash-Lite (Stable)
                </option>
                <option value="gemini-2.5-flash-live-preview">
                  Gemini 2.5 Flash Live (Preview)
                </option>
              </optgroup>
            </select>
          </div>

          <div
            className="form-group"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "8px",
            }}
          >
            <div>
              <label>Enabled</label>
              <p className="hint">Predict text when you are typing.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={processingEnabled}
                onChange={(e) => {
                  const val = e.target.checked
                  if (val && !apiKey.trim()) {
                    alert(
                      "A Gemini API Key is required to enable typing predictions!"
                    )
                    return
                  }
                  setProcessingEnabled(val)
                  window.electron?.saveConfig({
                    apiKey,
                    model,
                    processingEnabled: val,
                    startOnStartup,
                  })
                }}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div
            className="form-group"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "8px",
            }}
          >
            <div>
              <label>Start on Startup</label>
              <p className="hint">
                Launch Verbo automatically when you sign in.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={startOnStartup}
                onChange={(e) => {
                  const val = e.target.checked
                  setStartOnStartup(val)
                  window.electron?.saveConfig({
                    apiKey,
                    model,
                    processingEnabled,
                    startOnStartup: val,
                  })
                }}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button
            className={`save-btn ${status}`}
            onClick={handleSave}
            disabled={status === "saving"}
          >
            {status === "saving" ? (
              "Saving..."
            ) : status === "saved" ? (
              "Saved"
            ) : status === "error" ? (
              "Error"
            ) : (
              <>
                <Save size={16} strokeWidth={2} /> Save Changes
              </>
            )}
          </button>
        </section>

        <footer className="footer">
          <p className="footer-hint">
            Type anywhere to see suggestions. Press <strong>Tab</strong> to
            accept.
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
