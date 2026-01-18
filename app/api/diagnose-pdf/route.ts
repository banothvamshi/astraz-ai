/**
 * Diagnostic PDF Parsing Endpoint
 * Helps debug what's being extracted from PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { parsePDFReliable, isPDFBuffer } from "@/lib/pdf-parser-simple";
import { validateBase64, validatePDF } from "@/lib/validation";
import { normalizeResume, formatNormalizedResume } from "@/lib/resume-normalizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume } = body;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume file is required" },
        { status: 400 }
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("DIAGNOSTIC PDF PARSING ENDPOINT");
    console.log("=".repeat(60));

    // Validate base64
    const base64Validation = validateBase64(resume);
    if (!base64Validation.valid) {
      return NextResponse.json(
        { 
          error: "Invalid base64 encoding",
          validation: base64Validation,
        },
        { status: 400 }
      );
    }

    console.log("✅ Base64 validation passed");

    // Convert to buffer
    const base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
    const pdfBuffer = Buffer.from(base64Data, "base64");

    console.log(`Buffer size: ${pdfBuffer.length} bytes`);

    // Validate PDF
    const pdfValidation = validatePDF(pdfBuffer);
    if (!pdfValidation.valid) {
      return NextResponse.json(
        {
          error: "Invalid PDF file",
          validation: pdfValidation,
          bufferInfo: {
            size: pdfBuffer.length,
            isValidPDF: isPDFBuffer(pdfBuffer),
            firstBytes: pdfBuffer.slice(0, 20).toString('utf8', 0, 10),
          },
        },
        { status: 400 }
      );
    }

    console.log("✅ PDF validation passed");
    console.log(`Is valid PDF (starts with %PDF): ${isPDFBuffer(pdfBuffer)}`);

    // Parse PDF
    console.log("\n" + "-".repeat(60));
    console.log("PARSING PDF...");
    console.log("-".repeat(60));

    let extractedText: string;
    try {
      extractedText = await parsePDFReliable(pdfBuffer);
    } catch (parseError: any) {
      console.error("❌ PDF parsing failed:", parseError);
      return NextResponse.json(
        {
          error: "Failed to parse PDF",
          parseError: parseError.message,
          suggestion: "Try uploading the PDF again or exporting it as a new PDF from Word/Google Docs",
        },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error: "PDF was parsed but contains no readable text",
          extracted: { length: 0, preview: "" },
          suggestion: "The PDF might be image-based. Try converting it or exporting as a new PDF.",
        },
        { status: 400 }
      );
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters`);

    // Show preview
    const preview = extractedText.substring(0, 500);
    console.log("\nPreview of extracted text:");
    console.log(preview);

    // Try to normalize
    console.log("\n" + "-".repeat(60));
    console.log("NORMALIZING RESUME...");
    console.log("-".repeat(60));

    let normalized;
    try {
      normalized = await normalizeResume(extractedText);
      console.log("✅ Successfully normalized resume");
    } catch (normalizeError: any) {
      console.error("❌ Normalization failed:", normalizeError);
      return NextResponse.json(
        {
          status: "partial_success",
          extracted_text_length: extractedText.length,
          extracted_text_preview: preview,
          normalization_error: normalizeError.message,
          raw_text_for_manual_inspection: extractedText,
        },
        { status: 200 }
      );
    }

    // Format resume
    const formatted = formatNormalizedResume(normalized);

    console.log("\n" + "=".repeat(60));
    console.log("DIAGNOSTIC COMPLETE - SUCCESS");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      status: "success",
      diagnostics: {
        buffer_size_bytes: pdfBuffer.length,
        is_valid_pdf: isPDFBuffer(pdfBuffer),
        extracted_text_length: extractedText.length,
        extracted_pages: Math.ceil(extractedText.length / 2000),
      },
      parsed: {
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        location: normalized.location,
        summary: normalized.professional_summary.substring(0, 200),
        experience_count: normalized.experience.length,
        education_count: normalized.education.length,
        skills_count: normalized.skills.length,
        certifications_count: normalized.certifications.length,
      },
      experience: normalized.experience.map(e => ({
        title: e.title,
        company: e.company,
        duration: e.duration,
      })),
      skills: normalized.skills.slice(0, 30),
      raw_text_preview: extractedText.substring(0, 300),
      formatted_resume: formatted.substring(0, 500),
    });
  } catch (error: any) {
    console.error("Diagnostic endpoint error:", error);
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
