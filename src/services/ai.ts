export interface AISuggestionResponse {
  suggestion: string;
  reasoning?: string;
}

const WORKER_URL = 'https://cloudflare-ai-gateway.sk00990099009911.workers.dev/';
const API_KEY = 'Jl515OpIfKjIYJHTXFfCo0ufoTHNCzQWAL5DMPIS0HEHDrjw4MncZxIjkRcitUuqKVBvmDaVNWp4iSBGjz3w4EgUwGA3biGmeUsaGbsTuqnyhAsuhAF99tc7OerLtCphoFZJnXlFUEk7cBcyLmOwcVCDfMGcKCPCPIsT01b9bJCZbc0t5iZN3m3DcVHf37X2i2lVLZiypcC1ctNnwAbCq0oVrMELG3lEiq7OHC7HzVQ2cGS7oXyCBelICMrTNWpx';

export interface AIHistoryItem {
  context: string;
  suggestion: string;
  accepted: boolean;
}

export async function getAISuggestions(
  text: string, 
  signal?: AbortSignal, 
  history: AIHistoryItem[] = [],
  context: string = ''
): Promise<AISuggestionResponse> {
  if (!text && !context) return { suggestion: '' };

  try {
    const historyMessages = history.map(h => ([
      { role: 'user', content: `Context: "${h.context}"` },
      { role: 'assistant', content: h.suggestion },
      { role: 'system', content: h.accepted ? 'User accepted this suggestion.' : 'User rejected this suggestion.' }
    ])).flat();

    const messages = [
      {
        role: 'system',
        content: `You are a professional, real-time text completion engine. 
Strict Rules:
1. Provide a logical CONTINUATION of the text.
2. DO NOT respond as a chatbot. Do NOT answer questions. Do NOT provide conversational replies.
3. Return ONLY the suggested completion text, nothing else.
4. If you see rejected suggestions in the history, try a different style or variation.
5. Do not repeat the user's last few words unless necessary for grammar.`
      },
      ...historyMessages.slice(-15), // Keep a healthy window of history
      {
        role: 'user',
        content: `Complete this text: "${text}"`
      }
    ];

    console.log('[AI] Sending request with history...', { historyLen: history.length });
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      signal, // Attach the cancellation signal
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'x-session-affinity': 'verbo-typing-session-1'
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI] Request failed:', response.status, errText);
      throw new Error(`AI Request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[AI] Received raw result:', JSON.stringify(result).slice(0, 100) + '...');
    
    let suggestion = result.choices?.[0]?.message?.content || '';
    const reasoning = result.choices?.[0]?.message?.reasoning || '';

    // Sanitize: Remove leading/trailing newlines which cause "second row" or misalignment bugs
    suggestion = suggestion.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');

    console.log('[AI] Extracted suggestion:', suggestion);
    return { suggestion, reasoning };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('[AI Service] Request aborted by user typing.');
      return { suggestion: '' };
    }
    console.error('[AI Service] Error fetching suggestions:', err);
    return { suggestion: '' };
  }
}
