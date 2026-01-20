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
import { logGenerationData } from "@/lib/data-logger";

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
      !hasPlaceholderTokens(cachedResponse.resume)
    ) {
      return NextResponse.json({
        resume: cachedResponse.resume,
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

7. **INTELLIGENT CONTENT OVERHAUL (CRITICAL)**:
   - **DO NOT** just copy potential bullets from the original resume. **REWRITE THEM COMPLETELY**.
   - **REPHRASE** weak or passive bullet points into aggressive, impactful success statements.
   - **TAILOR** the content specifically to the JOB DESCRIPTION. If the JD asks for "Leadership", rewrite an experience to highlight "Led a team...".
   - **Example**: 
     - *Original*: "Worked on Python script for data."
     - *Overhauled*: "Architected a high-performance Python data pipeline, reducing processing time by 40% and enabling real-time analytics."
   - You MAY fill in missing details if they are obvious from context to make the resume complete and professional.
   - **AGGRESSIVELY OPTIMIZE** for the target role. If the candidate has 10 skills but the job only needs 3, HIGHLIGHT those 3 prominently.

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

Structure: Professional Summary → Experience → Education → Skills → Certifications (if applicable).

CRITICAL FORMATTING RULES:
0. **OCR CORRECTION**: If Job Titles or Company Names have typos (e.g. "Technicaior"), FIX them. Do not preserve errors.
1. **DO NOT** include the candidate's Name, Email, Phone, or Location at the top. The system adds this automatically.
2. **START DIRECTLY** with the first section header (e.g., \`# Professional Summary\`).
3. Use \`#\` for Main Section Headers.
4. **STRICTLY** use \`###\` for Job Titles (e.g. \`### Senior Software Engineer\`).
5. **NEVER** use bullet points for Job Titles or Headers. (e.g. DO NOT write \`- **Title**\`).
6. On the line immediately below the Job Title, put: \`** Company Name ** | Location | Dates\`
7. Use standard bullet points (\`-\`) ONLY for achievements/details.

Example Experience Entry:
### Senior Project Manager
**TechCorp Inc.** | San Francisco, CA | Jan 2020 - Present
- Led a team of 15...
- Increased revenue by...

CRITICAL REQUIREMENTS:
- Generate a COMPLETE resume with ALL information filled in (2 pages worth of content)
- Use actual company names, job titles, dates, and achievements from the original resume
- Do NOT leave any placeholders or empty sections
- Include ALL relevant experience, education, and skills from the original resume
- Make it comprehensive and complete
- Every section must be fully populated with real information
- If the original resume contains multiple roles or sections, include every one of them (do not summarize them away)
- **CRITICAL: DO NOT DUPLICATE ROLES**. If the candidate held the same role at the same company during the same period, merge them into one entry. Do not list identical roles twice.
- If a role implies multiple projects, listed them as bullet points under ONE role entry.

CRITICAL: Output ONLY the markdown content. Do NOT wrap it in code blocks. Output raw markdown text directly without any code block markers. Generate the COMPLETE resume now.`;

    // Generate resume with retry logic
    let generatedResume: string;
    try {
      const systemPrompt = `
    You are an expert ATS-Optimization AI. Your goal is to not just formatting, but to REWRITE and ELEVATE the user's resume.
    
    TRANSFORM MEDIOCRE CONTENT INTO EXECUTIVE-LEVEL ACHIEVEMENTS.
    
    CRITICAL INSTRUCTION - "MENTAL SANDBOX":
    Before generating the final resume, you must THINK silently to yourself to plan the overhaul.
    
    Wrap your analysis in a <thinking> block at the very beginning of your response.
    Inside <thinking>:
    1. **Analyze Gaps**: Compare the User's Resume vs. Job Description. What keywords are missing?
    2. **Strategy**: How will you rephrase "weak" bullets into "strong" ones?
    3. **Structure**: Plan the section order for maximum impact.
    
    Then, output the final Markdown Resume outside the <thinking> block.
    
    CRITICAL:
    1. **REPHRASE**: Rewrite every single bullet point to be stronger, punchier, and results-oriented.
    2. **MATCH JD**: Forcefully align the experience with the Job Description keywords.
    3. **NO COPY-PASTE**: Do not just copy the user's text. Improve it. Overhaul it.
    
    Structure your response EXACTLY as:
    <thinking>
    ... your analysis ...
    </thinking>
    
    # Professional Summary
    ... rest of resume ...

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
              maxOutputTokens: 15000, // Maximized for PERFECTION and detail
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

    // Validate generated content
    if (!generatedResume || generatedResume.trim().length < 100) {
      return NextResponse.json(
        { error: "Generated resume is too short. Please try again." },
        { status: 500 }
      );
    }

    // Clean generated content
    let cleanResume = generatedResume;

    // Remove <thinking> block if present
    const thinkingMatch = cleanResume.match(/<thinking>[\s\S]*?<\/thinking>/);
    if (thinkingMatch) {
      console.log("AI Mental Sandbox Strategy:", thinkingMatch[0]); // Log the strategy for debugging/analytics!
      cleanResume = cleanResume.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim();
    }

    // Remove code blocks if present
    cleanResume = cleanMarkdownContent(cleanResume);

    // Remove all placeholders
    cleanResume = removeAllPlaceholders(cleanResume);

    if (hasGibberishLetters(cleanResume)) {
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
      });
    } catch (cacheError) {
      // Cache failure is not critical, continue
      console.error("Cache error:", cacheError);
    }

    const response = NextResponse.json({
      resume: cleanResume,
      meta: {
        ...structuredResume,
        name: normalizedResume.name || structuredResume.name,
        email: normalizedResume.email || structuredResume.email,
        phone: normalizedResume.phone || structuredResume.phone,
        location: normalizedResume.location,
        linkedin: normalizedResume.linkedin,
        github: normalizedResume.github,
        website: normalizedResume.website,
      },
      parsedJob: {
        title: parsedJob.title,
        company: parsedJob.company,
        location: parsedJob.location,
        workMode: parsedJob.workMode,
      },
      cached: false,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });

    // Log the successful generation data
    // Intentionally not awaiting to avoid delaying response
    logGenerationData({
      clientId,
      isPremium,
      resumeData: structuredResume,
      jobDescription: parsedJob,
      generatedResume: cleanResume,
      contactInfo: {
        name: normalizedResume.name,
        email: normalizedResume.email,
        phone: normalizedResume.phone,
        linkedin: normalizedResume.linkedin,
        location: normalizedResume.location
      }
    });

    // Save generation to database (fire-and-forget)
    fetch(`${request.nextUrl.origin}/api/save-generation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: parsedJob.title,
        companyName: parsedJob.company,
        jobLocation: parsedJob.location,
        resumeContent: cleanResume,
        originalResumeText: finalResumeText?.substring(0, 5000), // Truncate for storage
        jobDescriptionText: jobDescription?.substring(0, 5000),
        isFreeGeneration: !isPremium,
      }),
    }).catch(() => { }); // Ignore errors, don't block response

    return response;
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
