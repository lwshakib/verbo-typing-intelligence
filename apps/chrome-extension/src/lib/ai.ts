import { GoogleGenAI } from "@google/genai"

export async function getAISuggestions(
  text: string
): Promise<{ suggestion: string; error?: string }> {
  try {
    const config = await chrome.storage.local.get([
      "enabled",
      "apiKey",
      "model",
    ])
    const enabled =
      config.enabled !== undefined ? Boolean(config.enabled) : false
    const apiKey = config.apiKey as string | undefined
    const model = (config.model || "gemini-2.5-flash-lite") as string

    if (!enabled) {
      console.log(
        "[Verbo CRX Background] Extension is currently disabled in settings. Skipping AI request."
      )
      return { suggestion: "" }
    }
    if (!apiKey || !apiKey.trim()) {
      console.log(
        "[Verbo CRX Background] No Google Gemini API key configured. Please configure it in the extension popup."
      )
      return { suggestion: "" }
    }

    if (!model.startsWith("gemini-")) {
      console.warn(
        "[Verbo CRX Background] Only Google Gemini models are supported currently. Model:",
        model
      )
      return { suggestion: "" }
    }

    const systemInstruction =
      "You are a context-aware inline typing assistant. Continue the user's text in a natural, highly relevant manner. Return ONLY the immediate, direct continuation of the text (from 1 to 8 words) to complete their sentence or thought. DO NOT repeat what they already wrote. DO NOT write explanations, formatting, markdown blocks, quotes, or use conversational language. If no sensible continuation is possible, return absolutely nothing."

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() })

    console.log(`[Verbo CRX Background] Triggering AI generation...`)
    console.log(` ├─ Model: ${model}`)
    console.log(` └─ Context text: "${text}"`)

    const startTime = performance.now()
    const response = await ai.models.generateContent({
      model: model,
      contents: `Context to continue:\n"${text}"`,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 20,
        temperature: 0.2,
      },
    })
    const duration = ((performance.now() - startTime) / 1000).toFixed(2)

    let suggestion = response.text || ""
    console.log(
      `[Verbo CRX Background] AI Response received (took ${duration}s):`
    )
    console.log(` ├─ Raw output: "${suggestion}"`)

    // Clean suggestion of spacing or leading/trailing quotation marks
    suggestion = suggestion.trim()
    if (suggestion.startsWith('"') && suggestion.endsWith('"')) {
      suggestion = suggestion.slice(1, -1)
    }
    if (suggestion.startsWith("'") && suggestion.endsWith("'")) {
      suggestion = suggestion.slice(1, -1)
    }

    // Ensure we do not suggest redundant spaces at the start if user has already typed a space
    if (text.endsWith(" ") && suggestion.startsWith(" ")) {
      suggestion = suggestion.slice(1)
    }

    console.log(` └─ Final clean suggestion: "${suggestion}"`)
    return { suggestion }
  } catch (error: any) {
    console.error("[Verbo CRX Background] AI Generation error:", error)
    return { suggestion: "", error: error.message }
  }
}
