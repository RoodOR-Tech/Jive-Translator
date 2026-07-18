/**
 * Translates standard English to authentic Jive using GitHub Models (Llama 3 8B).
 * Executes completely client-side to remain 100% compatible with static GitHub Pages hosting.
 *
 * The token is supplied by the visitor and sent only to the GitHub Models
 * endpoint below — the app never persists it (no localStorage/cookies), so it
 * only lives in memory for the current page session.
 */
export async function translateToJive(englishText: string, githubToken: string): Promise<string> {
  if (!englishText.trim()) return "";
  if (!githubToken.trim()) {
    return "Missing GitHub Token, gate! Paste your Personal Access Token (PAT) into the field above to activate the engine.";
  }

  try {
    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${githubToken.trim()}`
      },
      body: JSON.stringify({
        model: "meta-llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: `You are an absolute linguistic authority on 1930s Harlem Jive (using Cab Calloway's Hepster's Dictionary as your foundational baseline) and 1980s cinematic Jive (from the movie Airplane!).

            Translate the user's input text into highly authentic, rhythmically accurate Jive talk.

            Strict Rules:
            1. Do not just swap single words. Completely restructure the sentences, grammar patterns, period idioms, and syncopated cadence so it flows naturally.
            2. Smoothly adapt to typos, text shorthand, or modern idioms by capturing the intended meaning and contextualizing it to the era.
            3. Do not include any explanations, prefaces, conversational filler, markdown formatting, or notes. Return ONLY the raw translated sentences.`
          },
          {
            role: "user",
            content: englishText
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content?.trim();

    return translation || "The engine's layout out, chump. Try spinning the phrase again.";
  } catch (error: any) {
    console.error("Translation Error:", error);
    return `The engine is beat to the socks, pops. (Error: ${error.message || 'Check your token configuration'})`;
  }
}
