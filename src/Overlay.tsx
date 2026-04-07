import { useEffect, useState } from 'react';
import './Overlay.css';

export default function Overlay() {
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    const handleShowSuggestion = (_event: any, newSuggestion: string) => {
      setSuggestion(newSuggestion);
    };

    const handleHideSuggestion = () => {
      setSuggestion(null);
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
      <span className="suggestion">{suggestion}</span>
    </div>
  );
}

