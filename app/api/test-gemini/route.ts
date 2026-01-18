import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Test endpoint to verify Gemini API key and list available models
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY not set" },
        { status: 500 }
      );
    }

    const gemini = new GoogleGenerativeAI(apiKey);
    
    // Try to list models (if SDK supports it)
    const testModels = [
      "gemini-1.5-flash",
      "gemini-1.5-pro", 
      "gemini-pro",
    ];

    const results: any[] = [];

    for (const modelName of testModels) {
      try {
        const model = gemini.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        
        results.push({
          model: modelName,
          status: "success",
          response: text.substring(0, 50),
        });
        break; // If one works, we're good
      } catch (error: any) {
        results.push({
          model: modelName,
          status: "failed",
          error: error.message?.substring(0, 200) || String(error),
        });
      }
    }

    return NextResponse.json({
      apiKeySet: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      testResults: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
