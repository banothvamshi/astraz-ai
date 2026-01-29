import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Clean raw resume text using Gemini AI
 * corrective fixes for OCR errors, spacing, and formatting
 */
export async function cleanTextWithGemini(rawText: string): Promise<string> {
    if (!apiKey) {
        console.warn("GOOGLE_GEMINI_API_KEY not set. Skipping AI cleaning.");
        return rawText;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are an expert Resume Parsing Correction Agent. Your task is to clean the following raw text extracted from a resume PDF.
      
      The text contains OCR errors, spacing issues, and typo artifacts.
      
      SPECIFIC INSTRUCTIONS:
      1. Fix "iearning" -> "Learning"
      2. Fix "Artificiai" -> "Artificial"
      3. Fix "technicai" -> "Technical" (and "technicaior" -> "Technical Coordinator" or "Technical Lead")
      4. SPLIT concatenated words: "HighbrowTechnologyInc" -> "Highbrow Technology Inc", "coordinationissues" -> "coordination issues".
      5. FIX wide spacing: "T e c h n i c a l" -> "Technical".
      6. Remove artifacts like "--- PAGE BREAK ---".
      7. PRESERVE content, do not summarize.
      8. If you see "technicaior", check context. If it looks like a title, "Technical Lead" or "Coordinator" is likely.

      34. Your goal is to make it look like a human wrote it, fixing all PDF extraction artifacts.
      
      CRITICAL INTELLIGENCE:
      9. **ZERO HALLUCINATION RULE**: Do NOT add any content, skills, experience, or dates that are not present in the raw text. Your job is CLEANING, not WRITING.
      10. If text is unreadable, leave it as is. Do not guess.

      RAW TEXT:
      ${rawText.substring(0, 15000)} // Limit context window if needed, though 1.5 flash handles large context well.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanedText = response.text();

        if (!cleanedText) {
            throw new Error("Empty response from AI");
        }

        return cleanedText.trim();
    } catch (error) {
        console.error("AI Cleaning failed:", error);
        // Fallback to original text on failure
        return rawText;
    }
}
