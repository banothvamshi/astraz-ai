import { generateText } from "@/lib/gemini";

/**
 * AI Agent for cleaning raw resume text.
 * Fixes OCR artifacts, spacing issues, and capitalization errors.
 */
export async function cleanResumeTextWithAI(rawText: string): Promise<string> {
    if (!rawText || rawText.length < 50) return rawText;

    // Faster/cheaper model or prompt for this specific task
    const systemPrompt = `You are a specialized Text Correction AI. Your ONLY job is to fix OCR artifacts and formatting issues in resume text. 
  
  Do NOT rewrite content or change meaning. ONLY fix specific OCR errors.
  
  CRITICAL FIXES REQUIRED:
  1. **"technicaior"** -> REPLACE with "Technical" or "Technical Lead" (infer from context).
  2. **"Artificiai"** -> REPLACE with "Artificial".
  3. **"iearning"** -> REPLACE with "Learning".
  4. **"HighbrowTechnologyInc"** -> REPLACE with "Highbrow Technology Inc".
  5. **"S K I L I S"** or "SKILIS" -> REPLACE with "SKILLS".
  6. **"T e c h n i c a l"** (wide spacing) -> REPLACE with "Technical".
  7. **"QualityRater"** -> REPLACE with "Quality Rater" (if merged).
  8. **"MotionControiwith"** -> REPLACE with "Motion Control with".
  9. **"Inteiiigence"** -> REPLACE with "Intelligence".
  10. **"Pyhton"** -> REPLACE with "Python".
  11. **"J a v a S c r i p t"** -> REPLACE with "JavaScript".
  12. **"DataAnalystand"** -> REPLACE with "Data Analyst and".
  13. **"3D Animationand"** -> REPLACE with "3D Animation and".
  14. **"inMaya"** -> REPLACE with "in Maya".
  
  GENERAL RULES:
  - Fix "l" vs "i" confusion (confused lowercase L and uppercase I).
  - Fix missing spaces between words (CamelCase merging).
  - Fix wide spaces between letters (T E X T).
  
  RETURN ONLY THE CLEANED TEXT. NO MARKDOWN. NO COMMENTS.
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
