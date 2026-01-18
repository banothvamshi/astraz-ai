import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * List available Gemini models using REST API
 */
export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY not set" },
        { status: 500 }
      );
    }

    // Try to list models using REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Failed to list models: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 500),
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter models that support generateContent
    const availableModels = (data.models || [])
      .filter((model: any) => {
        const supportedMethods = model.supportedGenerationMethods || [];
        return supportedMethods.includes("generateContent");
      })
      .map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedGenerationMethods,
      }));

    return NextResponse.json({
      success: true,
      totalModels: data.models?.length || 0,
      availableModels: availableModels,
      allModels: data.models?.map((m: any) => m.name) || [],
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
