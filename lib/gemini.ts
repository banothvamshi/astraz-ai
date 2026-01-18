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

// Helper function to generate text using Gemini
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }
): Promise<string> {
  const gemini = getGemini();
  const model = gemini.getGenerativeModel({
    model: "gemini-1.5-flash", // Free tier model - fast and high quality
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 2000,
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
