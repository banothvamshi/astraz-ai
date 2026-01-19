import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { parseResumePDF, extractResumeSections, ParsedResume } from "@/lib/pdf-parser";
import { parseResumePDFEnhanced, extractStructuredSections } from "@/lib/pdf-parser-enhanced";
import { parseAdvancedPDF } from "@/lib/pdf-parser-advanced-v3";
import { removeAllPlaceholders, sanitizeCoverLetter as removeTemplateContent } from "@/lib/placeholder-detector";
import { parseUniversalDocument } from "@/lib/universal-document-parser-v2";
import { parsePDFReliable, isPDFBuffer } from "@/lib/pdf-parser-simple";
import { normalizeResume, formatNormalizedResume, NormalizedResume } from "@/lib/resume-normalizer";
import { parseJobDescription, extractKeywords } from "@/lib/job-description-parser";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { validatePDF, validateJobDescription, validateBase64, sanitizeJobDescription } from "@/lib/validation";
import { retry } from "@/lib/retry";
import { shouldAllowAPICall, getBillingStatusMessage } from "@/lib/billing-guard";
import { estimateCost, getCostOptimizationTips } from "@/lib/cost-optimizer";
import { validateGeneratedContent } from "@/lib/content-validator";

// Maximum execution time (25 seconds for Vercel)
const MAX_EXECUTION_TIME = 25000;

/**
 * Clean markdown content - remove code blocks and extra formatting
 */
function cleanMarkdownContent(content: string): string {
  if (!content) return content;

  // Remove markdown code blocks
  let cleaned = content
    .replace(/^```markdown\s*\n?/gm, "")
    .replace(/^```\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  // Remove inline code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check billing guard - prevent API calls after credits expire
    if (!shouldAllowAPICall()) {
      return NextResponse.json(
        {
          error: getBillingStatusMessage(),
          billingStatus: "disabled",
        },
        { status: 503 } // Service Unavailable
      );
    }
    // Parse request body with timeout protection
    let body;
    try {
      body = await Promise.race([
        request.json(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        ),
      ]) as any;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request format. Please ensure you're sending valid JSON." },
        { status: 400 }
      );
    }

    const { resume, jobDescription, companyName } = body;

    // Comprehensive validation
    if (!resume) {
      return NextResponse.json(
        { error: "Resume file is required. Please upload a PDF resume." },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required. Please paste the job description." },
        { status: 400 }
      );
    }

    // Validate and sanitize job description
    const jobDescValidation = validateJobDescription(jobDescription);
    if (!jobDescValidation.valid) {
      return NextResponse.json(
        { error: jobDescValidation.error },
        { status: 400 }
      );
    }
    const sanitizedJobDescription = sanitizeJobDescription(jobDescription);

    // Validate base64 resume
    const base64Validation = validateBase64(resume);
    if (!base64Validation.valid) {
      return NextResponse.json(
        { error: base64Validation.error || "Invalid resume format" },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const isPremium = request.headers.get("x-premium-user") === "true";
    const rateLimit = checkRateLimit(clientId, "generate", isPremium);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": isPremium ? "100" : "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
            "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Parse PDF with enhanced error handling
    let base64Data: string;
    try {
      base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
    } catch (error: any) {
      return NextResponse.json(
        { error: "Invalid resume format. Please upload a valid PDF file." },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = Buffer.from(base64Data, "base64");
    } catch (error: any) {
      return NextResponse.json(
        { error: "Failed to process resume file. Please ensure it's a valid PDF." },
        { status: 400 }
      );
    }

    // Validate PDF
    const pdfValidation = validatePDF(pdfBuffer);
    if (!pdfValidation.valid) {
      return NextResponse.json(
        { error: pdfValidation.error },
        { status: 400 }
      );
    }

    // STAGE 0: Parse PDF with simple reliable parser
    console.log("=".repeat(50));
    console.log("STAGE 0: Parsing PDF with Simple Reliable Parser");
    console.log("=".repeat(50));

    let resumeText: string;
    try {
      // Check if it's a valid PDF
      if (isPDFBuffer(pdfBuffer)) {
        console.log("✅ Buffer is valid PDF (starts with %PDF)");
      } else {
        console.warn("⚠️ Buffer doesn't start with %PDF - might be corrupted");
      }

      console.log(`Buffer size: ${pdfBuffer.length} bytes`);

      // Use simple reliable parser first
      resumeText = await retry(
        () => parsePDFReliable(pdfBuffer),
        {
          maxRetries: 2,
          initialDelay: 1000,
          retryableErrors: ["timeout", "network"],
        }
      );

      // Verification: If text implies failure (too short), throw to trigger fallback
      if (resumeText.length < 200) {
        throw new Error("Parsed text insufficient");
      }

      console.log(`✅ Successfully parsed PDF: ${resumeText.length} characters extracted`);

      if (resumeText.trim().length === 0) {
        throw new Error("PDF parsed but returned empty text");
      }
    } catch (parseError: any) {
      console.error("❌ Simple PDF parser failed:", parseError.message);
      console.log("Falling back to universal parser...");

      // Fallback to universal parser
      try {
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
        resumeText = parsedResume.text;
        console.log(`✅ Universal parser succeeded: ${resumeText.length} characters`);
      } catch (universalError: any) {
        console.error("❌ Both parsers failed!");
        return NextResponse.json(
          {
            error: "Failed to read PDF. Please ensure it's a valid, readable PDF file. Try exporting as a new PDF from Word/Google Docs.",
            details: process.env.NODE_ENV === "development"
              ? `Simple: ${parseError.message}, Universal: ${universalError.message}`
              : undefined,
            debug: process.env.NODE_ENV === "development"
              ? {
                bufferSize: pdfBuffer.length,
                isValidPDF: isPDFBuffer(pdfBuffer),
                firstBytes: pdfBuffer.slice(0, 20).toString('utf8', 0, 10),
              }
              : undefined,
          },
          { status: 400 }
        );
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        {
          error: "PDF appears to be empty or unreadable. Please ensure it contains text and try again.",
          debug: process.env.NODE_ENV === "development" ? `Extracted ${resumeText?.length || 0} characters` : undefined,
        },
        { status: 400 }
      );
    }

    // STAGE 1: Normalize raw resume to clean, structured format
    console.log("=".repeat(50));
    console.log("STAGE 1: Normalizing resume to clean format");
    console.log("=".repeat(50));
    console.log(`Input text length: ${resumeText.length} characters`);

    let normalizedResume: NormalizedResume;
    let cleanResumeFormatted: string;

    try {
      normalizedResume = await normalizeResume(resumeText);
      cleanResumeFormatted = formatNormalizedResume(normalizedResume);
      console.log("Resume normalized successfully");
    } catch (normalizeError: any) {
      console.error("Resume normalization error:", normalizeError.message);
      return NextResponse.json(
        {
          error: "Failed to normalize resume. Please ensure your resume contains standard sections (name, email, phone, experience, education, skills).",
          details: process.env.NODE_ENV === "development" ? normalizeError.message : undefined,
        },
        { status: 400 }
      );
    }

    // Use the clean formatted resume for generation (now properly structured)
    const finalResumeText = cleanResumeFormatted;
    const resumeSections = extractResumeSections(finalResumeText);
    const structuredResume = extractStructuredSections(finalResumeText);

    const hasGibberishLetters = (text: string): boolean => {
      if (!text || text.length < 100) return false; // Minimum threshold

      // Very lenient check - only reject if ALMOST EVERYTHING is gibberish
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) return true;

      let veryBadLines = 0;

      for (const line of lines) {
        const charCount: Record<string, number> = {};
        let alphanumeric = 0;

        for (const char of line) {
          if (char.match(/[A-Za-z0-9]/)) {
            charCount[char] = (charCount[char] || 0) + 1;
            alphanumeric++;
          }
        }

        if (alphanumeric === 0) continue;

        // Only flag if a single character is >90% of the line
        const maxCount = Math.max(...Object.values(charCount), 0);
        if (maxCount / alphanumeric > 0.9 && alphanumeric > 5) {
          veryBadLines++;
        }
      }

      // Only reject if >90% of lines are extremely corrupted
      return veryBadLines / lines.length > 0.9;
    };

    const hasPlaceholderTokens = (text: string): boolean => {
      if (!text) return false;
      return /\[[^\]]+\]/.test(text) || /Hiring Manager Name/i.test(text);
    };

    const sanitizeCoverLetterLocal = (text: string, candidateName?: string): string => {
      if (!text) return text;
      let cleaned = text;

      cleaned = cleaned
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          if (/^\[hiring manager name\]$/i.test(trimmed)) return false;
          if (/^hiring manager$/i.test(trimmed)) return true;
          if (trimmed.includes("[Hiring Manager") || trimmed.includes("[Candidate")) return false;
          return true;
        })
        .join("\n")
        .trim();

      if (candidateName) {
        cleaned = cleaned.replace(/\[(candidate'?s name|your name)\]/gi, candidateName);
      } else {
        cleaned = cleaned.replace(/\[(candidate'?s name|your name)\]/gi, "");
      }

      return cleaned.trim();
    };

    if (hasGibberishLetters(finalResumeText)) {
      return NextResponse.json(
        {
          error:
            "We couldn't read your resume text correctly (it looks like an image-based/encoded PDF). Please upload a text-based resume PDF (selectable text) or export a fresh PDF from Word/Google Docs.",
          debug:
            process.env.NODE_ENV === "development"
              ? {
                extractedChars: finalResumeText.length,
                tokenCount: finalResumeText.split(/\s+/).filter(Boolean).length,
                singleLetterTokenCount: finalResumeText
                  .split(/\s+/)
                  .filter(Boolean)
                  .filter((t: string) => /^[A-Za-z]$/.test(t)).length,
                preview: finalResumeText.slice(0, 300),
              }
              : undefined,
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResponse = getCachedResponse(finalResumeText, sanitizedJobDescription);
    if (
      cachedResponse &&
      !hasGibberishLetters(cachedResponse.resume) &&
      !hasGibberishLetters(cachedResponse.coverLetter) &&
      !hasPlaceholderTokens(cachedResponse.resume) &&
      !hasPlaceholderTokens(cachedResponse.coverLetter)
    ) {
      return NextResponse.json({
        resume: cachedResponse.resume,
        coverLetter: cachedResponse.coverLetter,
        cached: true,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
      });
    }

    // Parse job description
    let parsedJob;
    let keywords: string[];
    try {
      parsedJob = parseJobDescription(sanitizedJobDescription);
      keywords = extractKeywords(sanitizedJobDescription);
    } catch (parseError: any) {
      console.error("Job description parsing error:", parseError);
      // Continue with empty parsed data - not critical
      parsedJob = { title: undefined, company: undefined, skills: [], requirements: [], responsibilities: [] };
      keywords = [];
    }

    const normalizedJobTitle = parsedJob.title?.trim();
    const requestedCompanyName = typeof companyName === "string" ? companyName.trim() : "";
    const normalizedCompany = requestedCompanyName.length > 1 ? requestedCompanyName : parsedJob.company?.trim();
    const normalizedLocation = parsedJob.location?.trim();
    const displayTitle = normalizedJobTitle && normalizedJobTitle.length > 1 ? normalizedJobTitle : "the role";
    const displayCompany = normalizedCompany && normalizedCompany.length > 1 ? normalizedCompany : "the company";
    const displayLocation = normalizedLocation && normalizedLocation.length > 1 ? normalizedLocation : undefined;
    const coverLetterAddressee = normalizedCompany && normalizedCompany.length > 1
      ? `Hiring Manager at ${normalizedCompany}`
      : "Hiring Manager";

    // Check execution time
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > MAX_EXECUTION_TIME - 5000) {
      return NextResponse.json(
        { error: "Request timeout. Please try again with a smaller file." },
        { status: 408 }
      );
    }

    // PREMIUM resume generation prompt - Highest quality output
    const resumePrompt = `You are an elite executive resume writer with 25+ years of experience helping candidates secure positions at Fortune 500 companies, FAANG, and top-tier organizations. Your resumes consistently pass ATS systems and impress C-level executives.

TASK: Create a COMPLETE, PREMIUM, ATS-optimized resume that maximizes interview opportunities and showcases the candidate as an exceptional fit.

CRITICAL: Generate a COMPLETE resume with ALL sections filled out. Do NOT use placeholders like "[Company Name]", "[Your Name]", or "[Optional]". Use actual information from the original resume provided below.

CRITICAL REQUIREMENTS FOR MAXIMUM QUALITY:

1. **ATS Optimization (Critical)**:
   - Use EXACT standard section headers: "Professional Summary", "Professional Experience", "Education", "Technical Skills", "Certifications", "Projects" (if relevant)
   - NO tables, columns, graphics, or complex formatting
   - Use simple, clean bullet points (• or -)
   - Include ALL relevant keywords naturally: ${keywords.slice(0, 40).join(", ")}
   - Match job description terminology exactly where appropriate
   - Use standard date formats (MM/YYYY or Month YYYY)

2. **Content Excellence**:
   - Start each bullet with POWER action verbs: Architected, Spearheaded, Orchestrated, Transformed, Accelerated, Optimized, Delivered, etc.
   - EVERY bullet MUST include quantifiable metrics: numbers, percentages, dollar amounts, timeframes
   - Use the STAR method (Situation, Task, Action, Result) structure
   - Show progression and impact, not just duties
   - Highlight leadership, innovation, and measurable business impact
   - Match each experience point to job requirements

3. **Professional Summary (Critical)**:
   - 3-4 lines maximum
   - Include: Years of experience, core expertise, key achievement, value proposition
   - Must be compelling and keyword-rich
   - Example format: "Results-driven [Role] with [X] years of experience in [Domain]. Proven track record of [Key Achievement]. Expert in [Top 3 Skills]."

4. **Experience Section**:
   - Format: Company Name | Location | Dates (MM/YYYY - MM/YYYY)
   - Role Title (bold or prominent)
   - 4-6 powerful bullets per role (most recent role can have more)
   - Each bullet: Action verb + what you did + measurable impact
   - Show career progression and increasing responsibility

5. **Skills Section**:
   - Include skills explicitly mentioned in the ORIGINAL RESUME
   - You MAY also infer skills that are strongly implied by the candidate's experience (e.g. if they used "React", you can add "JavaScript" and "Frontend Development")
   - Categorize existing skills: Technical Skills, Tools & Technologies, Soft Skills
   - You can reorder and reorganize skills

6. **Formatting & Style**:
   - Clean, professional, scannable layout
   - Consistent spacing and formatting
   - Professional tone throughout
   - Zero typos or grammatical errors
   - Proper capitalization (Title Case for headers, sentence case for content)
   - Use parallel structure in bullets

7. **INTELLIGENT CONTENT UTILIZATION**:
   - Use information from the ORIGINAL RESUME CONTENT provided below.
   - You MAY rephrase, reorganize, and professionally polish the content.
   - You MAY fill in missing details if they are obvious from context (e.g. if Company is "Google", Industry is "Technology").
   - If the resume mentions a project but lacks details, you can expand on it based on standard industry practices for that role, BUT keep it grounded in reality.
   - DO NOT invent completely new roles, companies, or degrees.
   - If sections like "Skills" or "Projects" are missing in the structured data, LOOK IN THE "UNCLASSIFIED / OTHER INFORMATION" section.

ORIGINAL RESUME CONTENT:
${finalResumeText}

TARGET JOB INFORMATION:
Position: ${displayTitle}
Company: ${displayCompany}
${displayLocation ? `Location: ${displayLocation}` : ""}
${parsedJob.skills.length > 0 ? `Required Skills: ${parsedJob.skills.join(", ")}` : ""}
${parsedJob.experience ? `Experience Required: ${parsedJob.experience}` : ""}

COMPLETE JOB DESCRIPTION:
${sanitizedJobDescription}

Generate a PREMIUM, executive-level resume in clean markdown format. Ensure it:
- Passes ATS systems (no formatting issues)
- Impresses human recruiters (compelling content)
- Matches job requirements perfectly (keyword optimization)
- Shows quantifiable achievements (metrics everywhere)
- Demonstrates value and impact (results-focused)

Structure: Professional Summary → Experience → Education → Skills → Certifications (if applicable). Use clear markdown headers (# for main sections, ## for subsections).

CRITICAL REQUIREMENTS:
- Generate a COMPLETE resume with ALL information filled in
- Use actual company names, job titles, dates, and achievements from the original resume
- Do NOT leave any placeholders or empty sections
- Include ALL relevant experience, education, and skills from the original resume
- Make it comprehensive and complete - at least 1-2 pages of content
- Every section must be fully populated with real information
- If the original resume contains multiple roles or sections, include every one of them (do not summarize them away)

CRITICAL: Output ONLY the markdown content. Do NOT wrap it in code blocks. Output raw markdown text directly without any code block markers. Generate the COMPLETE resume now.`;

    // Generate resume with retry logic
    let generatedResume: string;
    try {
      const systemPrompt = `
    You are an expert ATS-Optimization AI. Your goal is to write a perfect, keyword-optimized resume and cover letter based on the user's background and the target job description.
    
    CRITICAL INPUT HANDLING:
    - The user's resume has been parsed from a PDF and may contain "parsing artifacts".
    - **Merged Words**: You might see text like "DataScience" or "ProjectManagement". PLEASE READ THESE AS "Data Science" and "Project Management".
    - **Spaced Text**: You might see "S U M M A R Y". Read this as "SUMMARY".
    - **Missing Sections**: If a section (like Skills) is empty in the structured data, LOOK AT THE "RAW TEXT" or "UNCLASSIFIED CONTENT" to find it.
    - **Inference**: If the resume says "Google", infer "Tech" industry / high standards. If "React", infer "Frontend".
    
    STRICT RULES:
    1. **NO HALLUCINATION**: Do not invent jobs, degrees, or companies. You MAY rephrase/polish descriptions, but do not make up facts.
    2. **ATS OPTIMIZATION**: Use keywords from the Job Description naturally.
    3. **Professional Tone**: Use active voice, strong action verbs, and quantify results (e.g. "Increased sales by 20%").
    
    Structure your response EXACTLY as the logical structure requested.
    `;
      generatedResume = await retry(
        () =>
          generateText(
            resumePrompt,
            systemPrompt,
            {
              temperature: 0.4, // Lower for more consistent, professional output
              maxOutputTokens: 8000, // Increased significantly for complete, comprehensive resumes
            }
          ),
        {
          maxRetries: 2,
          initialDelay: 2000,
          retryableErrors: ["rate limit", "quota", "timeout"],
        }
      );
    } catch (genError: any) {
      console.error("Resume generation error:", genError);

      if (genError.message?.includes("rate limit") || genError.message?.includes("quota")) {
        return NextResponse.json(
          {
            error: "AI service is temporarily busy. Please try again in a few moments.",
            retryAfter: 60,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to generate resume. Please try again.",
          details: process.env.NODE_ENV === "development" ? genError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Premium cover letter generation
    const candidateName = structuredResume.name || resumeSections.name;
    const candidateEmail = structuredResume.email || resumeSections.email;
    const candidatePhone = structuredResume.phone || resumeSections.phone;

    const coverLetterPrompt = `You are a master cover letter writer who crafts compelling, personalized letters that get candidates interviews.

TASK: Write a COMPLETE, premium cover letter that:
1. Opens with a strong, attention-grabbing hook
2. Demonstrates understanding of the company and role
3. Connects candidate's experience to job requirements
4. Shows enthusiasm and cultural fit
5. Ends with a confident call to action

CRITICAL: Generate a COMPLETE cover letter. Do NOT use placeholders. Use actual information from the resume and job description.

CRITICAL REQUIREMENTS:
- Address it to: ${coverLetterAddressee}
- Reference the position: ${displayTitle}
- Use SPECIFIC examples from the resume (mention actual achievements, companies, projects)
- Show knowledge of the company/industry from the job description
- Professional but warm tone
- 3-4 well-structured paragraphs (250-400 words total)
- No generic phrases like "I am writing to apply" or "[Your Name]"
- Be concise but impactful
- Include candidate's actual name: ${candidateName || "the candidate"}
- Include specific achievements and metrics from their experience

 CANDIDATE INFORMATION:
${candidateName ? `Name: ${candidateName}` : ""}
${candidateEmail ? `Email: ${candidateEmail}` : ""}
${candidatePhone ? `Phone: ${candidatePhone}` : ""}
Key Experience: ${resumeSections.sections["EXPERIENCE"]?.substring(0, 500) || finalResumeText.substring(0, 500)}

JOB DETAILS:
Position: ${displayTitle}
Company: ${displayCompany}
${displayLocation ? `Location: ${displayLocation}` : ""}

Full Job Description:
${sanitizedJobDescription}

Generate a COMPLETE, premium, personalized cover letter in markdown format. 

CRITICAL REQUIREMENTS:
- Write the FULL cover letter with all paragraphs complete
- Use actual information - no placeholders
- Include specific examples from the candidate's resume
- Reference the company name: ${displayCompany}
- Reference the job title: ${displayTitle}
- Make it compelling and complete (250-400 words)

CRITICAL: Output ONLY the markdown content. Do NOT wrap it in code blocks. Output raw markdown text directly without any code block markers.

SIGN-OFF RULES:
- End the letter with "Sincerely," on its own line.
- Then print the candidate's real name on the next line.
- If candidate name is missing from the resume text, end with just "Sincerely," and do NOT add placeholders.

Generate the COMPLETE cover letter now.`;

    // Generate cover letter with retry logic
    let generatedCoverLetter: string;
    try {
      generatedCoverLetter = await retry(
        () =>
          generateText(
            coverLetterPrompt,
            `You are an expert cover letter writer with a track record of helping candidates land interviews.
            Your cover letters are personalized, compelling, and demonstrate genuine interest.
            You avoid clichés and generic statements. Every sentence adds value.
            Maintain authenticity and professionalism.`,
            {
              temperature: 0.5, // Lower for more consistent quality
              maxOutputTokens: 3500, // Increased for complete, compelling cover letters
            }
          ),
        {
          maxRetries: 2,
          initialDelay: 2000,
          retryableErrors: ["rate limit", "quota", "timeout"],
        }
      );
    } catch (genError: any) {
      console.error("Cover letter generation error:", genError);

      // If cover letter fails but resume succeeded, return partial success
      if (generatedResume) {
        return NextResponse.json(
          {
            resume: generatedResume,
            coverLetter: null,
            error: "Failed to generate cover letter. Resume generated successfully.",
            rateLimit: {
              remaining: rateLimit.remaining,
              resetAt: rateLimit.resetAt,
            },
          },
          { status: 207 } // Multi-Status
        );
      }

      if (genError.message?.includes("rate limit") || genError.message?.includes("quota")) {
        return NextResponse.json(
          {
            error: "AI service is temporarily busy. Please try again in a few moments.",
            retryAfter: 60,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to generate cover letter. Please try again.",
          details: process.env.NODE_ENV === "development" ? genError.message : undefined,
        },
        { status: 500 }
      );
    }

    generatedCoverLetter = sanitizeCoverLetterLocal(generatedCoverLetter, candidateName);

    // Validate generated content
    if (!generatedResume || generatedResume.trim().length < 100) {
      return NextResponse.json(
        { error: "Generated resume is too short. Please try again." },
        { status: 500 }
      );
    }

    if (!generatedCoverLetter || generatedCoverLetter.trim().length < 50) {
      return NextResponse.json(
        { error: "Generated cover letter is too short. Please try again." },
        { status: 500 }
      );
    }

    // Clean generated content - remove code blocks if present
    let cleanResume = cleanMarkdownContent(generatedResume);
    let cleanCoverLetter = cleanMarkdownContent(generatedCoverLetter);

    // Remove all placeholders from both resume and cover letter
    cleanResume = removeAllPlaceholders(cleanResume);
    cleanCoverLetter = removeAllPlaceholders(cleanCoverLetter);

    // Additional cover letter placeholder sanitization
    cleanCoverLetter = sanitizeCoverLetterLocal(cleanCoverLetter, candidateName);

    if (hasGibberishLetters(cleanResume) || hasGibberishLetters(cleanCoverLetter)) {
      return NextResponse.json(
        {
          error:
            "Generated content looks corrupted. Please re-upload your resume as a text-based PDF (selectable text) or export a fresh PDF from Word/Google Docs.",
        },
        { status: 400 }
      );
    }

    // Validate content doesn't contain hallucinated information
    const resumeValidation = validateGeneratedContent(cleanResume, finalResumeText);
    if (!resumeValidation.valid && resumeValidation.errors.length > 0) {
      console.warn("Resume validation warnings:", resumeValidation.errors);
      // Log but don't fail - the prompt should prevent this
    }

    // Cache the response
    try {
      setCachedResponse(finalResumeText, sanitizedJobDescription, {
        resume: cleanResume,
        coverLetter: cleanCoverLetter,
      });
    } catch (cacheError) {
      // Cache failure is not critical, continue
      console.error("Cache error:", cacheError);
    }

    return NextResponse.json({
      resume: cleanResume,
      coverLetter: cleanCoverLetter,
      cached: false,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });
  } catch (error: any) {
    console.error("Generation error:", {
      error: error.message,
      stack: error.stack,
      clientId: getClientIdentifier(request),
      timestamp: new Date().toISOString(),
    });

    // Provide helpful error messages
    const errorMsg = error.message || "Unknown error";

    if (errorMsg.includes("timeout") || errorMsg.includes("TIMEOUT")) {
      return NextResponse.json(
        { error: "Request timed out. Please try again with a smaller file or shorter job description." },
        { status: 408 }
      );
    }

    if (errorMsg.includes("PDF")) {
      return NextResponse.json(
        {
          error: errorMsg || "Failed to process PDF. Please ensure it's a valid, text-based PDF file.",
        },
        { status: 400 }
      );
    }

    if (errorMsg.includes("API key") || errorMsg.includes("GOOGLE_GEMINI")) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 }
      );
    }

    if (errorMsg.includes("rate limit") || errorMsg.includes("quota")) {
      return NextResponse.json(
        {
          error: "AI service is temporarily busy. Please try again in a few moments.",
          retryAfter: 60,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: errorMsg || "Failed to generate documents. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
