chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getAISuggestion') {
    handleAISuggestion(request.text, sendResponse);
    return true; // Keep the message channel open for asynchronous sendResponse
  }
});

async function handleAISuggestion(text: string, sendResponse: (response: any) => void) {
  try {
    const config = await chrome.storage.local.get(['enabled', 'apiKey', 'model']);
    const enabled = config.enabled as boolean | undefined;
    const apiKey = config.apiKey as string | undefined;
    const model = (config.model || 'gemini-3-flash-preview') as string;

    if (enabled === false || !apiKey) {
      sendResponse({ suggestion: "" });
      return;
    }

    if (!model.startsWith('gemini-')) {
      console.warn('[AI] Only Google Gemini models are supported currently. Model:', model);
      sendResponse({ suggestion: "" });
      return;
    }

    const SYSTEM_INSTRUCTION = "You are a context-aware inline typing assistant. Continue the user's text in a natural, highly relevant manner. Return ONLY the immediate, direct continuation of the text (from 1 to 8 words) to complete their sentence or thought. DO NOT repeat what they already wrote. DO NOT write explanations, formatting, markdown blocks, quotes, or use conversational language. If no sensible continuation is possible, return absolutely nothing.";

    let suggestion = "";

    // REST call exactly according to the Google Gemini API REST documentation
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Context to continue:\n\"" + text + "\"" }]
        }],
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.2
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      suggestion = data.candidates[0].content.parts[0].text;
    }

    // Clean suggestion of spacing or leading/trailing quotation marks
    suggestion = suggestion.trim();
    if (suggestion.startsWith('"') && suggestion.endsWith('"')) {
      suggestion = suggestion.slice(1, -1);
    }
    if (suggestion.startsWith("'") && suggestion.endsWith("'")) {
      suggestion = suggestion.slice(1, -1);
    }
    
    // Ensure we do not suggest redundant spaces at the start if user has already typed a space
    if (text.endsWith(' ') && suggestion.startsWith(' ')) {
      suggestion = suggestion.slice(1);
    }

    sendResponse({ suggestion });
  } catch (error: any) {
    console.error('Verbo Extension background fetch error:', error);
    sendResponse({ suggestion: "", error: error.message });
  }
}
