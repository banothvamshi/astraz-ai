import { NextRequest, NextResponse } from "next/server";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { validateJobDescription } from "@/lib/validation";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { retry } from "@/lib/retry";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { content, type, name, email, company, jobTitle } = body;

    // Validation
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!type || (type !== "resume" && type !== "coverLetter")) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'resume' or 'coverLetter'" },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: "Content is too short to generate PDF" },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "Content is too long. Maximum is 50,000 characters." },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const isPremium = request.headers.get("x-premium-user") === "true";
    const rateLimit = checkRateLimit(clientId, "download", isPremium);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": isPremium ? "500" : "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
            "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Generate PDF with retry logic
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await retry(
        () =>
          generateProfessionalPDF({
            type,
            content,
            name: name || undefined,
            email: email || undefined,
            company: company || undefined,
            jobTitle: jobTitle || undefined,
          }),
        {
          maxRetries: 2,
          initialDelay: 1000,
          retryableErrors: ["timeout"],
        }
      );
    } catch (error: any) {
      console.error("PDF generation error:", error);
      return NextResponse.json(
        {
          error: error.message || "Failed to generate PDF. Please try again.",
          details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        { error: "Generated PDF is empty" },
        { status: 500 }
      );
    }

    // Check PDF size (safety check)
    const maxPdfSize = 10 * 1024 * 1024; // 10MB
    if (pdfBuffer.length > maxPdfSize) {
      return NextResponse.json(
        { error: "Generated PDF is too large" },
        { status: 500 }
      );
    }

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const sanitizedName = name
      ? name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)
      : "";
    const filename = `${type === "resume" ? "Resume" : "CoverLetter"}${sanitizedName ? `_${sanitizedName}` : ""
      }_${timestamp}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.resetAt.toString(),
      },
    });
  } catch (error: any) {
    console.error("Download PDF error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate PDF. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
