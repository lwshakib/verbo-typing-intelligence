import { useState, useEffect } from 'react'
import { Minus, X, Save } from 'lucide-react'
import './App.css'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gemini-3.1-flash-lite-preview')
  const [processingEnabled, setProcessingEnabled] = useState(true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    // Load initial config
    (window as any).electron.getConfig().then((config: any) => {
      if (config.apiKey) setApiKey(config.apiKey)
      if (config.model) setModel(config.model)
      if (config.processingEnabled !== undefined) setProcessingEnabled(config.processingEnabled)
    })
  }, [])

  const handleSave = () => {
    setStatus('saving')
    try {
      (window as any).electron.saveConfig({ 
        apiKey, 
        model,
        processingEnabled
      })
      setTimeout(() => setStatus('saved'), 500)
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
    }
  }

  const win = (window as any).electron

  return (
    <div className="app-container">
      {/* Custom Title Bar */}
      <div className="title-bar">
        <div className="title">
          <span>VERBO AI</span>
        </div>
        <div className="window-controls">
          <button onClick={() => win.minimize()} className="control-btn"><Minus size={16} strokeWidth={2} /></button>
          <button onClick={() => win.close()} className="control-btn close"><X size={16} strokeWidth={2} /></button>
        </div>
      </div>

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
            <p className="hint">Works with Google, OpenAI, or Anthropic keys.</p>
          </div>

          <div className="form-group">
            <label>Model selection</label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="model-select"
            >
              <optgroup label="OpenAI GPT-5 (Latest)">
                <option value="gpt-5.4-pro">GPT-5.4 Pro</option>
                <option value="gpt-5.4">GPT-5.4</option>
                <option value="gpt-5.4-mini">GPT-5.4 Mini</option>
                <option value="gpt-5.4-nano">GPT-5.4 Nano</option>
                <option value="gpt-5.3-chat-latest">GPT-5.3 Chat Latest</option>
                <option value="gpt-5.2-pro">GPT-5.2 Pro</option>
                <option value="gpt-5.2-chat-latest">GPT-5.2 Chat Latest</option>
                <option value="gpt-5.2">GPT-5.2</option>
                <option value="gpt-5.1-codex-max">GPT-5.1 Codex Max</option>
                <option value="gpt-5.1-codex">GPT-5.1 Codex</option>
                <option value="gpt-5.1-codex-mini">GPT-5.1 Codex Mini</option>
                <option value="gpt-5.1-chat-latest">GPT-5.1 Chat Latest</option>
                <option value="gpt-5.1">GPT-5.1</option>
                <option value="gpt-5-pro">GPT-5 Pro</option>
                <option value="gpt-5">GPT-5</option>
                <option value="gpt-5-mini">GPT-5 Mini</option>
                <option value="gpt-5-nano">GPT-5 Nano</option>
                <option value="gpt-5-codex">GPT-5 Codex</option>
                <option value="gpt-5-chat-latest">GPT-5 Chat Latest</option>
              </optgroup>

              <optgroup label="OpenAI GPT-4.1 & O-Series">
                <option value="gpt-4.1-pro">GPT-4.1 Pro</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                <option value="gpt-4.1-nano">GPT-4.1 Nano</option>
                <option value="o3">o3 (Reasoning)</option>
                <option value="o3-mini">o3-mini</option>
                <option value="o1">o1 (Full Reasoning)</option>
                <option value="o1-mini">o1-mini</option>
                <option value="o1-preview">o1-preview</option>
              </optgroup>

              <optgroup label="Anthropic Claude 4 (Messages API)">
                <option value="claude-opus-4-6">Claude 4.6 Opus</option>
                <option value="claude-sonnet-4-6">Claude 4.6 Sonnet</option>
                <option value="claude-opus-4-5">Claude 4.5 Opus</option>
                <option value="claude-sonnet-4-5">Claude 4.5 Sonnet</option>
                <option value="claude-opus-4-20250514">Claude 4.0 Opus (2025)</option>
                <option value="claude-sonnet-4-20250514">Claude 4.0 Sonnet (2025)</option>
                <option value="claude-sonnet-4-5-20250929">Claude 4.5 Stable</option>
              </optgroup>

              <optgroup label="Anthropic Claude 3.7 & 3.5">
                <option value="claude-sonnet-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet Latest</option>
                <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku Latest</option>
              </optgroup>

              <optgroup label="Google Gemini">
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </optgroup>
            </select>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <div>
              <label>Enabled</label>
              <p className="hint">Predict text when you are typing.</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={processingEnabled} 
                onChange={(e) => setProcessingEnabled(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <button  
            className={`save-btn ${status}`} 
            onClick={handleSave}
            disabled={status === 'saving'}
          >
            {status === 'saving' ? 'Saving...' : 
             status === 'saved' ? 'Saved' : 
             status === 'error' ? 'Error' : 
             <><Save size={16} strokeWidth={2} /> Save Changes</>}
          </button>
        </section>

        <footer className="footer">
          <p className="footer-hint">Type anywhere to see suggestions. Press <strong>Tab</strong> to accept.</p>
        </footer>
      </main>
    </div>
  )
}

export default App
