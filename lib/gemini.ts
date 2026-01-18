import { GoogleGenerativeAI } from "@google/generative-ai";
import { shouldAllowAPICall, getBillingStatusMessage } from "./billing-guard";

// Lazy initialization to avoid build-time errors
let geminiInstance: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!geminiInstance) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
    }
    if (apiKey.length < 20) {
      throw new Error("GOOGLE_GEMINI_API_KEY appears to be invalid (too short)");
    }
    // Initialize with API key - SDK will handle API version automatically
    geminiInstance = new GoogleGenerativeAI(apiKey);
  }
  return geminiInstance;
}

/**
 * List available models (for debugging)
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    const gemini = getGemini();
    // Note: The SDK doesn't have a direct listModels method, but we can infer from errors
    return [];
  } catch (error) {
    return [];
  }
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
    // Check billing guard - prevent API calls after credits expire
    if (!shouldAllowAPICall()) {
      throw new Error(
        `Service disabled: ${getBillingStatusMessage()}. ` +
        `To prevent charges, API calls have been disabled. ` +
        `Please set DISABLE_BILLING=false only if you want to enable paid billing (not recommended).`
      );
    }
    
    const gemini = getGemini();
    
    // Validate prompt length (Gemini has limits)
    const maxPromptLength = 1000000; // ~1M characters
    if (prompt.length > maxPromptLength) {
      throw new Error(`Prompt is too long (${prompt.length} characters). Maximum is ${maxPromptLength} characters.`);
    }

    // Use configurable model name - try multiple options if first fails
    // Can be overridden via GEMINI_MODEL environment variable
    const modelName = process.env.GEMINI_MODEL;
    
    // Try different model names in order of preference (FREE TIER MODELS)
    // Based on Google AI Studio API keys, these should work
    // The SDK automatically uses the correct API version
    const modelNamesToTry = modelName 
      ? [modelName]
      : [
          "gemini-1.5-flash",         // FREE - Fast, efficient model (most likely to work)
          "gemini-1.5-flash-001",     // Alternative naming
          "gemini-1.5-pro",           // FREE tier available
          "gemini-1.5-pro-001",       // Alternative naming
          "gemini-pro",               // Legacy free model
          "gemini-pro-001",           // Alternative naming
        ];
    
    let lastError: Error | null = null;
    let text: string | null = null;
    let successfulModel: string | null = null;
    
    // Try each model until one works
    for (const name of modelNamesToTry) {
      try {
        // Clean model name (remove 'models/' prefix if present in some configs)
        const cleanName = name.replace(/^models\//, "");
        
        const model = gemini.getGenerativeModel({
          model: cleanName,
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
        text = response.text();
        successfulModel = cleanName;
        
        // Log successful model for debugging
        console.log(`Successfully used Gemini model: ${cleanName}`);
        
        // If we get here, generation was successful
        break;
      } catch (modelError: any) {
        lastError = modelError;
        const errorMsg = modelError.message || String(modelError);
        
        // Log which model failed for debugging
        console.log(`Model ${name} failed: ${errorMsg.substring(0, 100)}`);
        
        // If it's a model not found error, try next model
        if (errorMsg.includes("not found") || errorMsg.includes("404") || errorMsg.includes("is not found")) {
          // Continue to next model
          continue;
        }
        
        // For other errors (quota, safety, etc.), don't retry with different models
        throw modelError;
      }
    }
    
    if (!text) {
      // Provide helpful error message with troubleshooting
      const errorDetails = lastError?.message || "Unknown error";
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
      const apiKeyPreview = apiKey.length > 10 ? `${apiKey.substring(0, 10)}...` : "not set";
      
      throw new Error(
        `No available Gemini model found. Tried: ${modelNamesToTry.join(", ")}. ` +
        `Last error: ${errorDetails}. ` +
        `\n\nTroubleshooting:` +
        `\n1. Verify your GOOGLE_GEMINI_API_KEY is correct (current: ${apiKeyPreview})` +
        `\n2. Check API key has access to Gemini models at https://aistudio.google.com/app/api-keys` +
        `\n3. Ensure API key is from a project WITHOUT billing (for free tier)` +
        `\n4. Enable "Generative Language API" in Google Cloud Console` +
        `\n5. Visit /api/list-models to see available models for your API key` +
        `\n6. Try creating a NEW API key in a project WITHOUT billing account` +
        `\n7. Check available models: https://ai.google.dev/models/gemini`
      );
    }

    // Validate response
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI model");
    }

    return text;
  } catch (error: any) {
    // Enhanced error handling
    const errorMsg = error.message || String(error);

    // Model not found error - provide helpful guidance
    if (errorMsg.includes("not found") || errorMsg.includes("404") || errorMsg.includes("is not found")) {
      const currentModel = process.env.GEMINI_MODEL || "gemini-pro";
      throw new Error(
        `AI model "${currentModel}" is not available. ` +
        `Please set GEMINI_MODEL environment variable to a valid model name (e.g., gemini-pro, gemini-1.5-pro). ` +
        `Error: ${errorMsg}`
      );
    }

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
