import { getAISuggestions } from '../lib/ai';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getAISuggestion') {
    getAISuggestions(request.text).then(sendResponse);
    return true; // Keep the message channel open for asynchronous sendResponse
  }
});
