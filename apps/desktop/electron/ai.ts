import { GoogleGenAI } from "@google/genai"

export interface AISuggestionResponse {
  suggestion: string
}

export interface AIHistoryItem {
  context: string
  suggestion: string
  accepted: boolean
}

export async function getAISuggestions(
  text: string,
  signal?: AbortSignal,
  history: AIHistoryItem[] = [],
  config?: {
    apiKey: string
    model: string
  }
): Promise<AISuggestionResponse> {
  if (!config?.model || !config?.apiKey) return { suggestion: "" }

  try {
    if (!config.model.startsWith("gemini-")) {
      console.warn(
        "[AI] Only Google Gemini models are supported currently. Model:",
        config.model
      )
      return { suggestion: "" }
    }

    // Initialize the official Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey: config.apiKey })

    // Format history for the model
    const historyText = history
      .slice(-5)
      .map(
        (h) =>
          `Context: "${h.context}"\nSuggestion: "${h.suggestion}"\nStatus: ${h.accepted ? "Accepted" : "Rejected"}`
      )
      .join("\n\n")

    const systemInstruction = `You are a Typing Intelligence. Your only job is to predict the NEXT few words the user is about to type.
Strict Rules:
1. NEVER answer a question. If the user types "How are you?", predict a continuation like " doing today?".
2. Maintain the exact style, tone, and formatting of the input.
3. Return ONLY the predicted text. No chatter, no explanations.
4. If a suggestion was rejected in history, do not repeat it.
5. If you cannot provide a logical continuation, return an empty string.`

    const prompt = `HISTORY:\n${historyText}\n\nCURRENT_TEXT: "${text}"\n\nCONTINUATION:`

    console.log(
      `[AI] Requesting completion with model: ${config.model} using official Google Gen AI SDK`
    )

    // Call using the official Google Gen AI SDK from the provided documentation
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 20,
        temperature: 0.2,
      },
    })

    const suggestion = response.text || ""
    const cleanSuggestion = suggestion
      .replace(/^[\r\n]+/, "")
      .replace(/[\r\n]+$/, "")

    console.log("[AI] Suggestion:", cleanSuggestion)
    return { suggestion: cleanSuggestion }
  } catch (err: unknown) {
    if (signal?.aborted) {
      return { suggestion: "" }
    }
    console.error("[AI Service] SDK Error:", err)
    return { suggestion: "" }
  }
}
