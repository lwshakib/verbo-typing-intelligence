import { useEffect, useState } from 'react';
import './Overlay.css';

export default function Overlay() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [contextText, setContextText] = useState<string | null>(null);

  useEffect(() => {
    const handleShowSuggestion = (_event: any, newSuggestion: string, context: string) => {
      setSuggestion(newSuggestion);
      setContextText(context);
    };

    const handleHideSuggestion = () => {
      setSuggestion(null);
      setContextText(null);
    };

    if (window.ipcRenderer) {
      window.ipcRenderer.on('show-suggestion', handleShowSuggestion);
      window.ipcRenderer.on('hide-suggestion', handleHideSuggestion);
    }

    return () => {
      if (window.ipcRenderer) {
        window.ipcRenderer.off('show-suggestion', handleShowSuggestion);
        window.ipcRenderer.off('hide-suggestion', handleHideSuggestion);
      }
    };
  }, []);

  if (!suggestion) return null;

  return (
    <div className="overlay-container">
      <div className="suggestion-box">
        <span className="context">{contextText?.slice(-15)}</span>
        <div className="separator" />
        <span className="suggestion">{suggestion}</span>
        <div className="hint">Tab</div>
      </div>
    </div>
  );
}

