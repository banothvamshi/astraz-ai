/**
 * COMPLETE OVERHAUL: Resume + Cover Letter Generation
 * Fixes: PDF reading, AI improvement, beautiful PDF formatting, career switch support
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { parseUniversalDocument } from "@/lib/universal-document-parser-v2";
import { parsePDFReliable, isPDFBuffer } from "@/lib/pdf-parser-simple";
import { normalizeResume, formatNormalizedResume } from "@/lib/resume-normalizer";
import { parseJobDescription, extractKeywords } from "@/lib/job-description-parser";
import { removeAllPlaceholders } from "@/lib/placeholder-detector";
import { generateAdvancedATSPrompt, generateAdvancedCoverLetterPrompt } from "@/lib/advanced-ai-prompts";
import { generateResumePDF, generateATSResumePDF } from "@/lib/advanced-pdf-generator";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { validatePDF, validateJobDescription, sanitizeJobDescription } from "@/lib/validation";
import { retry } from "@/lib/retry";
import { shouldAllowAPICall, getBillingStatusMessage } from "@/lib/billing-guard";

const MAX_EXECUTION_TIME = 25000;

function cleanMarkdownContent(content: string): string {
  if (!content) return content;

  // 1. Remove generic "thinking" blocks if model outputs them wrapped in tags or common patterns
  let cleaned = content
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/^thinking:?\s*[\s\S]*?\n\n/gim, "") // Remove "Thinking:\n..."
    .replace(/^```markdown\s*\n?/gm, "")
    .replace(/^```\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  // 2. Remove inline code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");

  // 3. AGGRESSIVE: Remove everything before the first Header 1 (# Name) or Common Header
  // This safeguards against "Here is the resume..." preambles.
  const firstHeaderIndex = cleaned.search(/^#\s+/m);
  if (firstHeaderIndex > 0) {
    console.log("Found preamble in generation, stripping content before first header...");
    cleaned = cleaned.substring(firstHeaderIndex);
  }

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

function extractJSON(text: string): any {
  try {
    // Try to find JSON between markers or code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    console.error("Failed to extract JSON from:", text.substring(0, 200));
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check billing
    if (!shouldAllowAPICall()) {
      return NextResponse.json(
        { error: getBillingStatusMessage(), billingStatus: "disabled" },
        { status: 503 }
      );
    }

    // Parse request
    let body;
    try {
      body = await Promise.race([
        request.json(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        ),
      ]) as any;
    } catch {
      return NextResponse.json(
        { error: "Invalid request format. Please send valid JSON." },
        { status: 400 }
      );
    }

    const { resume, jobDescription, companyName } = body;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume file is required. Please upload a PDF resume." },
        { status: 400 }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required. Please paste the job description." },
        { status: 400 }
      );
    }

    // ============================================
    // STAGE 0: PDF PARSING - CRITICAL FIX
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 0: EXTRACTING TEXT FROM PDF");
    console.log("=".repeat(70));

    let resumeText = "";
    try {
      // Convert base64 to buffer
      const base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
      const pdfBuffer = Buffer.from(base64Data, "base64");

      console.log(`Buffer size: ${pdfBuffer.length} bytes`);
      console.log(`Is valid PDF: ${isPDFBuffer(pdfBuffer)}`);

      // Try simple parser first
      try {
        resumeText = await parsePDFReliable(pdfBuffer);
        console.log(`✅ PDF parsed successfully: ${resumeText.length} characters`);
      } catch (simplError: any) {
        console.error("Simple parser failed:", simplError.message);

        // Fallback to universal parser
        const parsedResume = await parseUniversalDocument(pdfBuffer, {
          includeOCR: true,
          ocrLanguage: "eng",
          maxPages: 100,
          mergePages: true,
        });
        resumeText = parsedResume.text;
        console.log(`✅ Fallback parser succeeded: ${resumeText.length} characters`);
      }

      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json(
          {
            error: "PDF appears empty or unreadable. Please ensure it contains text.",
            details: `Extracted: ${resumeText?.length || 0} characters`,
          },
          { status: 400 }
        );
      }
    } catch (pdfError: any) {
      console.error("PDF extraction failed:", pdfError.message);
      return NextResponse.json(
        {
          error: "Failed to read PDF. Please ensure it's a valid PDF file.",
          suggestion: "Try exporting from Word/Google Docs as a fresh PDF.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // STAGE 1: NORMALIZE RESUME
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 1: NORMALIZING RESUME DATA");
    console.log("=".repeat(70));

    let normalizedResume;
    let cleanResumeText;
    try {
      normalizedResume = await normalizeResume(resumeText);
      cleanResumeText = formatNormalizedResume(normalizedResume);
      console.log("✅ Resume normalized successfully");
    } catch (normalizeError: any) {
      console.error("Normalization failed:", normalizeError.message);
      return NextResponse.json(
        {
          error: "Could not extract resume data. Please ensure your resume includes: name, email, phone, experience, education, skills.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // STAGE 2: PARSE JOB DESCRIPTION
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 2: ANALYZING JOB DESCRIPTION");
    console.log("=".repeat(70));

    const sanitizedJobDesc = sanitizeJobDescription(jobDescription);
    const parsedJob = parseJobDescription(sanitizedJobDesc);
    const keywords = extractKeywords(sanitizedJobDesc);

    console.log(`Extracted ${keywords.length} keywords from job description`);
    console.log(`Required skills: ${parsedJob.skills.slice(0, 5).join(", ")}`);

    // ============================================
    // STAGE 3: GENERATE OPTIMIZED ATS RESUME
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 3: GENERATING ATS-OPTIMIZED RESUME");
    console.log("=".repeat(70));

    const resumePrompt = generateAdvancedATSPrompt(
      cleanResumeText,
      sanitizedJobDesc,
      `The candidate's original resume name: ${normalizedResume.name}`
    );

    let generatedResume = "";
    try {
      generatedResume = await retry(
        () =>
          generateText(resumePrompt, "You are an expert ATS resume optimizer.", {
            temperature: 0.3,
            maxOutputTokens: 8000,
          }),
        { maxRetries: 2, initialDelay: 1000 }
      );
      generatedResume = cleanMarkdownContent(generatedResume);
      console.log(`✅ Resume generated: ${generatedResume.length} characters`);
    } catch (genError: any) {
      console.error("Resume generation failed:", genError.message);
      return NextResponse.json(
        { error: "Failed to generate resume. Please try again." },
        { status: 500 }
      );
    }

    // ============================================
    // STAGE 4: GENERATE COVER LETTER
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 4: GENERATING PERSONALIZED COVER LETTER");
    console.log("=".repeat(70));

    const coverLetterPrompt = generateAdvancedCoverLetterPrompt(
      cleanResumeText,
      sanitizedJobDesc,
      normalizedResume.name || "Candidate"
    );

    let generatedCoverLetter = "";
    try {
      generatedCoverLetter = await retry(
        () =>
          generateText(coverLetterPrompt, "You are an expert cover letter writer.", {
            temperature: 0.4,
            maxOutputTokens: 3000,
          }),
        { maxRetries: 1, initialDelay: 1000 }
      );
      generatedCoverLetter = cleanMarkdownContent(generatedCoverLetter);
      console.log(`✅ Cover letter generated: ${generatedCoverLetter.length} characters`);
    } catch (clError: any) {
      console.error("Cover letter generation failed:", clError.message);
      generatedCoverLetter = "Unable to generate cover letter at this time.";
    }

    // ============================================
    // STAGE 5: CLEAN AND REMOVE PLACEHOLDERS
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 5: CLEANING UP CONTENT");
    console.log("=".repeat(70));

    generatedResume = removeAllPlaceholders(generatedResume);
    generatedCoverLetter = removeAllPlaceholders(generatedCoverLetter);

    console.log("✅ Placeholders removed");

    // ============================================
    // STAGE 6: GENERATE BEAUTIFUL PDF
    // ============================================
    console.log("\n" + "=".repeat(70));
    console.log("STAGE 6: GENERATING PDF DOCUMENTS");
    console.log("=".repeat(70));

    let resumePdfBuffer: Buffer | null = null;
    let atsResumePdfBuffer: Buffer | null = null;

    try {
      // Convert NormalizedResume to ResumeData format
      const resumeDataForPDF = {
        name: normalizedResume.name,
        email: normalizedResume.email,
        phone: normalizedResume.phone,
        location: normalizedResume.location,
        summary: normalizedResume.professional_summary,
        experience: normalizedResume.experience.map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          description: Array.isArray(exp.description) ? exp.description.join("\n") : exp.description,
        })),
        education: normalizedResume.education.map((edu: any) => ({
          degree: edu.degree,
          institution: edu.institution,
          year: edu.graduation_date,
          details: Array.isArray(edu.details) ? edu.details.join(", ") : edu.details,
        })),
        skills: normalizedResume.skills,
        certifications: normalizedResume.certifications,
      };

      // Try to generate beautiful PDF
      resumePdfBuffer = await generateResumePDF(resumeDataForPDF, generatedCoverLetter);
      console.log(`✅ Beautiful resume PDF generated: ${resumePdfBuffer.length} bytes`);
    } catch (pdfError: any) {
      console.error("Beautiful PDF generation failed:", pdfError.message);
      resumePdfBuffer = null;
    }

    try {
      const resumeDataForATS = {
        name: normalizedResume.name,
        email: normalizedResume.email,
        phone: normalizedResume.phone,
        location: normalizedResume.location,
        summary: normalizedResume.professional_summary,
        experience: normalizedResume.experience.map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          description: Array.isArray(exp.description) ? exp.description.join("\n") : exp.description,
        })),
        education: normalizedResume.education.map((edu: any) => ({
          degree: edu.degree,
          institution: edu.institution,
          year: edu.graduation_date,
          details: Array.isArray(edu.details) ? edu.details.join(", ") : edu.details,
        })),
        skills: normalizedResume.skills,
        certifications: normalizedResume.certifications,
      };

      // Generate ATS-optimized plain text PDF
      atsResumePdfBuffer = await generateATSResumePDF(resumeDataForATS);
      console.log(`✅ ATS resume PDF generated: ${atsResumePdfBuffer.length} bytes`);
    } catch (atsPdfError: any) {
      console.error("ATS PDF generation failed:", atsPdfError.message);
      atsResumePdfBuffer = null;
    }

    console.log("\n" + "=".repeat(70));
    console.log("GENERATION COMPLETE - ALL STAGES SUCCESSFUL");
    console.log("=".repeat(70) + "\n");

    // ============================================
    // RETURN RESPONSE
    // ============================================
    return NextResponse.json({
      success: true,
      resume: {
        markdown: generatedResume,
        pdf: resumePdfBuffer ? resumePdfBuffer.toString("base64") : null,
        atsPDF: atsResumePdfBuffer ? atsResumePdfBuffer.toString("base64") : null,
      },
      coverLetter: {
        markdown: generatedCoverLetter,
        text: generatedCoverLetter,
      },
      metadata: {
        candidateName: normalizedResume.name,
        extractedPages: Math.ceil(resumeText.length / 2000),
        characterCount: resumeText.length,
        jobKeywords: keywords.slice(0, 20),
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
