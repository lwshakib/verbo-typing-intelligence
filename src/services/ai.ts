export interface AISuggestionResponse {
  suggestion: string;
  reasoning?: string;
}

const WORKER_URL = 'https://cloudflare-ai-gateway.sk00990099009911.workers.dev/';
const API_KEY = 'Jl515OpIfKjIYJHTXFfCo0ufoTHNCzQWAL5DMPIS0HEHDrjw4MncZxIjkRcitUuqKVBvmDaVNWp4iSBGjz3w4EgUwGA3biGmeUsaGbsTuqnyhAsuhAF99tc7OerLtCphoFZJnXlFUEk7cBcyLmOwcVCDfMGcKCPCPIsT01b9bJCZbc0t5iZN3m3DcVHf37X2i2lVLZiypcC1ctNnwAbCq0oVrMELG3lEiq7OHC7HzVQ2cGS7oXyCBelICMrTNWpx';

export async function getAISuggestions(text: string, signal?: AbortSignal, context: string = ''): Promise<AISuggestionResponse> {
  if (!text && !context) return { suggestion: '' };

  try {
    console.log('[AI] Sending request to worker...', { textLen: text.length });
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
        messages: [
          {
            role: 'system',
            content: 'You are a real-time typing assistant. Provide a short, logical completion for the user\'s text. Return ONLY the suggested completion text, nothing else. If you cannot provide a completion, return an empty string.'
          },
          {
            role: 'user',
            content: `Complete this text: "${text}"`
          }
        ],
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
    const suggestion = result.choices?.[0]?.message?.content || '';
    const reasoning = result.choices?.[0]?.message?.reasoning || '';

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
