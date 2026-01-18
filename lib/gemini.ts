import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization to avoid build-time errors
let geminiInstance: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!geminiInstance) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
    }
    geminiInstance = new GoogleGenerativeAI(apiKey);
  }
  return geminiInstance;
}

// Helper function to generate text using Gemini with comprehensive error handling
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }
): Promise<string> {
  try {
    const gemini = getGemini();
    
    // Validate prompt length (Gemini has limits)
    const maxPromptLength = 1000000; // ~1M characters
    if (prompt.length > maxPromptLength) {
      throw new Error(`Prompt is too long (${prompt.length} characters). Maximum is ${maxPromptLength} characters.`);
    }

    const model = gemini.getGenerativeModel({
      model: "gemini-1.5-flash", // Free tier model - fast and high quality
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2000,
        topP: 0.95,
        topK: 40,
      },
    });

    // Generate with timeout
    const timeout = 30000; // 30 seconds
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Generation timeout")), timeout)
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    // Validate response
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI model");
    }

    return text;
  } catch (error: any) {
    // Enhanced error handling
    const errorMsg = error.message || String(error);

    if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key")) {
      throw new Error("AI service configuration error. Please contact support.");
    }

    if (errorMsg.includes("QUOTA_EXCEEDED") || errorMsg.includes("quota")) {
      throw new Error("AI service quota exceeded. Please try again later.");
    }

    if (errorMsg.includes("SAFETY") || errorMsg.includes("blocked")) {
      throw new Error("Content was blocked by safety filters. Please modify your input.");
    }

    if (errorMsg.includes("timeout") || errorMsg.includes("TIMEOUT")) {
      throw new Error("AI service timeout. Please try again.");
    }

    // Re-throw with context
    throw new Error(`AI generation failed: ${errorMsg}`);
  }
}
