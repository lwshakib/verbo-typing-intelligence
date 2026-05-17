export async function getAISuggestions(text: string): Promise<{ suggestion: string; error?: string }> {
  try {
    const config = await chrome.storage.local.get(['enabled', 'apiKey', 'model']);
    const enabled = config.enabled !== undefined ? Boolean(config.enabled) : false;
    const apiKey = config.apiKey as string | undefined;
    const model = (config.model || 'gemini-2.5-flash-lite') as string;

    if (!enabled || !apiKey || !apiKey.trim()) {
      return { suggestion: "" };
    }

    if (!model.startsWith('gemini-')) {
      console.warn('[AI] Only Google Gemini models are supported currently. Model:', model);
      return { suggestion: "" };
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
    
    if (data.error) {
      console.error('[Verbo AI API Error]:', data.error);
      return { suggestion: "", error: data.error.message };
    }

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

    return { suggestion };
  } catch (error: any) {
    console.error('Verbo Extension background fetch error:', error);
    return { suggestion: "", error: error.message };
  }
}
