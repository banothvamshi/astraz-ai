import { generateText } from "@/lib/gemini";

/**
 * AI Agent for cleaning raw resume text.
 * Fixes OCR artifacts, spacing issues, and capitalization errors.
 */
export async function cleanResumeTextWithAI(rawText: string): Promise<string> {
    if (!rawText || rawText.length < 50) return rawText;

    // Faster/cheaper model or prompt for this specific task
    const systemPrompt = `You are a specialized Text Correction AI. Your ONLY job is to fix OCR artifacts and formatting issues in resume text. 
  
  Do NOT rewrite content or change meaning. ONLY fix:
  1. **OCR Errors**: Fix "l" vs "i" confusion (e.g., "Artificiai" -> "Artificial", "technicaior" -> "Technical").
  2. **Spacing Issues**: 
     - Fix wide-spaced text (e.g., "T e c h n i c a l" -> "Technical").
     - Fix missing spaces (e.g., "HighbrowTechnologyInc" -> "Highbrow Technology Inc").
  3. **Typos**: Fix obvious spelling errors in common tech terms (e.g., "Pyhton" -> "Python").
  
  CRITICAL:
  - Preserve the original structure and newlines.
  - Return ONLY the cleaned text. Do not add introductory text.
  - If a word is ambiguous, keep it as is.
  - Look specifically for "technicaior" -> "Technical Lead" or "Technical".
  `;

    const userPrompt = `Clean this resume text:\n\n${rawText.substring(0, 15000)}`; // Limit to avoid token limits

    try {
        // We use a lower temperature for deterministic cleaning
        const cleanedText = await generateText(userPrompt, systemPrompt, {
            temperature: 0.1,
            maxOutputTokens: 15000
        });

        return cleanedText.trim();
    } catch (error) {
        console.error("AI Cleaning failed:", error);
        return rawText; // Fallback to raw text if AI fails
    }
}
