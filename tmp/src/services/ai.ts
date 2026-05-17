import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export interface AISuggestionResponse {
  suggestion: string;
}

export interface AIHistoryItem {
  context: string;
  suggestion: string;
  accepted: boolean;
}

export async function getAISuggestions(
  text: string, 
  signal?: AbortSignal, 
  history: AIHistoryItem[] = [],
  _context: string = '',
  config?: { 
    apiKey: string, 
    model: string
  }
): Promise<AISuggestionResponse> {
  if (!config?.model || !config?.apiKey) return { suggestion: '' };

  try {
    let model;
    const providerOptions: any = {};

    if (config.model.startsWith('gemini-')) {
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
      model = google(config.model);
    } else if (
      config.model.startsWith('gpt-') || 
      config.model.startsWith('o1') || 
      config.model.startsWith('o3')
    ) {
      const openai = createOpenAI({ apiKey: config.apiKey });
      model = openai(config.model);
    } else if (config.model.startsWith('claude-')) {
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      model = anthropic(config.model);
    } else {
      console.warn('[AI] Unknown model provider for:', config.model);
      return { suggestion: '' };
    }

    // Format history for the model
    const historyText = history.slice(-5).map(h => 
      `Context: "${h.context}"\nSuggestion: "${h.suggestion}"\nStatus: ${h.accepted ? 'Accepted' : 'Rejected'}`
    ).join('\n\n');

    const systemInstruction = `You are a Ghost Writer. Your only job is to predict the NEXT few words the user is about to type.
Strict Rules:
1. NEVER answer a question. If the user types "How are you?", predict a continuation like " doing today?".
2. Maintain the exact style, tone, and formatting of the input.
3. Return ONLY the predicted text. No chatter, no explanations.
4. If a suggestion was rejected in history, do not repeat it.
5. If you cannot provide a logical continuation, return an empty string.`;

    const prompt = `HISTORY:\n${historyText}\n\nCURRENT_TEXT: "${text}"\n\nCONTINUATION:`;

    console.log(`[AI] Requesting completion with model: ${config.model}`);

    const { text: suggestion } = await generateText({
      model: model,
      system: systemInstruction,
      prompt: prompt,
      abortSignal: signal,
      providerOptions,
    });

    const cleanSuggestion = (suggestion || '').replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
    
    console.log('[AI] Suggestion:', cleanSuggestion);
    return { suggestion: cleanSuggestion };
  } catch (err: any) {
    if (err.name === 'AbortError' || signal?.aborted) {
      return { suggestion: '' };
    }
    console.error('[AI Service] SDK Error:', err);
    return { suggestion: '' };
  }
}
