/**
 * Normalize Resume Endpoint
 * Returns normalized/cleaned resume structure
 * Useful for validation and debugging
 */

import { NextRequest, NextResponse } from "next/server";
import { parseUniversalDocument } from "@/lib/universal-document-parser-v2";
import { normalizeResume, formatNormalizedResume } from "@/lib/resume-normalizer";
import { validatePDF, validateBase64 } from "@/lib/validation";
import { retry } from "@/lib/retry";
import { getClientIdentifier } from "@/lib/rate-limiter";

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

    // Validate and convert base64
    const base64Validation = validateBase64(resume);
    if (!base64Validation.valid) {
      return NextResponse.json(
        { error: base64Validation.error || "Invalid resume format" },
        { status: 400 }
      );
    }

    const base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
    const pdfBuffer = Buffer.from(base64Data, "base64");

    // Validate PDF
    const pdfValidation = validatePDF(pdfBuffer);
    if (!pdfValidation.valid) {
      return NextResponse.json(
        { error: pdfValidation.error },
        { status: 400 }
      );
    }

    // Parse document
    console.log("Parsing document...");
    // Parse document
    console.log("Parsing document...");
    const parsedResume = await retry(
      () => parseUniversalDocument(pdfBuffer, {
        includeOCR: true,
        ocrLanguage: "eng",
        maxPages: 100,
        mergePages: true,
      }),
      {
        maxRetries: 2,
        initialDelay: 1000,
        retryableErrors: ["timeout", "network"],
      }
    );

    // AI Cleaning Step
    console.log("Applying AI Cleaning Agent...");
    const { cleanTextWithGemini } = await import("@/lib/gemini-cleaner");
    const cleanedText = await cleanTextWithGemini(parsedResume.text);
    console.log(`AI Cleaning complete. Original length: ${parsedResume.text.length}, Cleaned length: ${cleanedText.length}`);

    // Normalize resume using the CLEANED text
    console.log("Normalizing resume...");
    const normalizedResume = await normalizeResume(cleanedText);
    const formattedResume = formatNormalizedResume(normalizedResume);

    // Return normalized structure
    return NextResponse.json({
      status: "success",
      normalized: {
        name: normalizedResume.name,
        email: normalizedResume.email,
        phone: normalizedResume.phone,
        location: normalizedResume.location,
        professional_summary: normalizedResume.professional_summary,
        experience_count: normalizedResume.experience.length,
        education_count: normalizedResume.education.length,
        skills_count: normalizedResume.skills.length,
        certifications_count: normalizedResume.certifications.length,
        projects_count: normalizedResume.projects.length,
      },
      experience: normalizedResume.experience.map(e => ({
        title: e.title,
        company: e.company,
        duration: e.duration,
        bullets: e.description.slice(0, 3), // First 3 bullets
      })),
      education: normalizedResume.education.map(e => ({
        degree: e.degree,
        field: e.field,
        institution: e.institution,
        graduation_date: e.graduation_date,
      })),
      skills: normalizedResume.skills.slice(0, 20), // First 20 skills
      formatted_resume: formattedResume,
    });
  } catch (error: any) {
    console.error("Normalization error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to normalize resume",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
