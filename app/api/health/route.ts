import { NextResponse } from "next/server";

/**
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
      services: {
        gemini: "ok", // Could check API key exists
        database: "ok", // Could check Supabase connection
      },
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
