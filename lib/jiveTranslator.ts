/**
 * Translates standard English to authentic Jive using Gemini.
 * Executes completely client-side to remain 100% compatible with static GitHub Pages hosting.
 *
 * The API key is supplied by the visitor and sent only to the Gemini API
 * endpoint below — the app never persists it (no localStorage/cookies), so it
 * only lives in memory for the current page session.
 */
export async function translateToJive(englishText: string, geminiApiKey: string): Promise<string> {
  if (!englishText.trim()) return "";
  if (!geminiApiKey.trim()) {
    return "Missing Gemini API key, gate! Paste your key into the field above to activate the engine.";
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey.trim()
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: `You are an absolute linguistic authority on 1930s Harlem Jive (using Cab Calloway's Hepster's Dictionary as your foundational baseline) and 1980s cinematic Jive (from the movie Airplane!).

            Translate the user's input text into highly authentic, rhythmically accurate Jive talk.

            Strict Rules:
            1. Do not just swap single words. Completely restructure the sentences, grammar patterns, period idioms, and syncopated cadence so it flows naturally.
            2. Smoothly adapt to typos, text shorthand, or modern idioms by capturing the intended meaning and contextualizing it to the era.
            3. Do not include any explanations, prefaces, conversational filler, markdown formatting, or notes. Return ONLY the raw translated sentences.` }]
        },
        contents: [{
          role: "user",
          parts: [{ text: englishText }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error("Gemini's request quota is temporarily exhausted. Wait about 20 seconds, then click Translate again.");
      }
      const apiMessage = errData.error?.message || errData.message || errData.detail;
      throw new Error(apiMessage || `Gemini rejected the request (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const translation = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    return translation || "The engine's layout out, chump. Try spinning the phrase again.";
  } catch (error: any) {
    console.error("Translation Error:", error);
    return `The engine is beat to the socks, pops. (Error: ${error.message || 'Check your token configuration'})`;
  }
}
