import { useEffect, useState } from 'react';
import './Overlay.css';

export default function Overlay() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout | null = null;

    const handleShowSuggestion = (_event: unknown, newSuggestion: unknown) => {
      if (hideTimer) clearTimeout(hideTimer);
      if (typeof newSuggestion === 'string') {
        setSuggestion(newSuggestion);
      }
      requestAnimationFrame(() => {
        setVisible(true);
      });
    };

    const handleHideSuggestion = () => {
      setVisible(false);
      hideTimer = setTimeout(() => {
        setSuggestion(null);
      }, 150); // Matches transition duration
    };

    const api = window.electron;
    if (api?.on) {
      api.on('show-suggestion', handleShowSuggestion);
      api.on('hide-suggestion', handleHideSuggestion);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (api?.off) {
        api.off('show-suggestion', handleShowSuggestion);
        api.off('hide-suggestion', handleHideSuggestion);
      }
    };
  }, []);

  return (
    <div className="overlay-container">
      <span className={`suggestion ${visible && suggestion ? 'visible' : ''}`}>
        {suggestion || ''}
      </span>
    </div>
  );
}
