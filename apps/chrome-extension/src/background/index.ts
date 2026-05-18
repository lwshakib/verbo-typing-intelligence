import { getAISuggestions } from '../lib/ai';

console.log('[Verbo CRX Background Process] Background service worker initialized and active!');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[Verbo CRX Background] Intercepted runtime message from tab ${sender.tab?.id || 'unknown'}:`, JSON.stringify(request));
  
  if (request.action === 'getAISuggestion') {
    console.log(`[Verbo CRX Background] Executing AI suggestion pipeline for text: "${request.text}"`);
    getAISuggestions(request.text)
      .then((res) => {
        console.log('[Verbo CRX Background] Pipeline finished. Transmitting response to content script:', JSON.stringify(res));
        sendResponse(res);
      })
      .catch((err) => {
        console.error('[Verbo CRX Background] Uncaught error in AI pipeline:', err);
        sendResponse({ suggestion: '', error: String(err) });
      });
    return true; // Keep the message channel open for asynchronous sendResponse
  }
});
