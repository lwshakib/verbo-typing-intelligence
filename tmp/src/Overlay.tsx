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

    const api = (window as any).electron;
    if (api?.on) {
      api.on('show-suggestion', handleShowSuggestion);
      api.on('hide-suggestion', handleHideSuggestion);
    }

    return () => {
      if (api?.off) {
        api.off('show-suggestion', handleShowSuggestion);
        api.off('hide-suggestion', handleHideSuggestion);
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

