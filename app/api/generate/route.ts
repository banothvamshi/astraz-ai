import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

import { parseResumePDF, extractResumeSections, ParsedResume } from "@/lib/pdf-parser";
import { parseResumePDFEnhanced, extractStructuredSections } from "@/lib/pdf-parser-enhanced";
import { generateResumePDF, generateATSResumePDF } from "@/lib/advanced-pdf-generator";
import { removeAllPlaceholders, sanitizeCoverLetter as removeTemplateContent } from "@/lib/placeholder-detector";
import { parseUniversalDocument } from "@/lib/universal-document-parser-v2";
import { parsePDFReliable, isPDFBuffer } from "@/lib/pdf-parser-simple";
import { normalizeResume, formatNormalizedResume, NormalizedResume } from "@/lib/resume-normalizer";
import { parseJobDescription, extractKeywords } from "@/lib/job-description-parser";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { validatePDF, validateJobDescription, validateBase64, sanitizeJobDescription } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server"; // Authentication & DB
import { retry } from "@/lib/retry";
import { shouldAllowAPICall, getBillingStatusMessage } from "@/lib/billing-guard";
import { estimateCost, getCostOptimizationTips } from "@/lib/cost-optimizer";
import { validateGeneratedContent } from "@/lib/content-validator";
import { logGenerationData } from "@/lib/data-logger";
import { calculateTotalExperience } from "@/lib/experience-calculator";

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

    // ==========================================
    // USER CREDIT CHECK (Account Level)
    // ==========================================
    const authClient = await createClient();
    const { data: { user: authUser } } = await authClient.auth.getUser();

    if (authUser) {
      const { data: profile } = await authClient
        .from("profiles")
        .select("credits_remaining, is_admin")
        .eq("id", authUser.id)
        .single();

      // PARANOID BILLING CHECK
      // If profile is missing (DB Error) OR credits <= 0, BLOCK.
      if (!profile || (!profile.is_admin && (profile.credits_remaining === null || Number(profile.credits_remaining) <= 0))) {
        return NextResponse.json(
          { error: "Insufficient credits. Please top up to generate resumes." },
          { status: 402 } // Payment Required
        );
      }
    } else {
      // GUEST USERS: Strict blocking or Rate Limit
      // User Requirement: "generations should not work if non account user already used free 1 use"
      // Since we cannot reliably track "1 use" across serverless executions without DB, we will BLOCK guests or use IP rate limit.
      // For safety/strictness as requested: BLOCK. Force them to sign up.
      // OR: Allow 1 request per IP using rate-limiter.
      const ip = getClientIdentifier(request);
      const { allowed } = checkRateLimit(ip, "generate", false);
      if (!allowed) {
        return NextResponse.json(
          { error: "Free trial limit reached. Please sign up to continue." },
          { status: 429 }
        );
      }
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

    const { resume, jobDescription, companyName, includeCoverLetter, contactOverrides } = body;
    // Note: 'userId' from body is IGNORED in favor of authorizedUserId from session


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

    // Authenticate and Authorize
    // const { createClient } = await import("@/utils/supabase/server"); // Removed to fix shadowing

    const supabase = await createClient(); // Await cookie store
    const { data: { user } } = await supabase.auth.getUser();

    let authorizedUserId: string | null = null;
    let effectiveIsPremium = false;

    if (user) {
      authorizedUserId = user.id;

      // Server-side Truth Source for Premium/Credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, credits_remaining, subscription_end_date, free_generations_used")
        .eq("id", user.id)
        .single();

      if (profile) {
        // Check expiry
        let isExpired = false;
        if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
          isExpired = true;
        }

        effectiveIsPremium = profile.is_premium && !isExpired;

        // Credit Check
        const hasCredits = (profile.credits_remaining !== null && profile.credits_remaining > 0);
        const isUnlimited = (profile.credits_remaining === -1);

        // STRICT QUOTA ENFORCEMENT
        if (!effectiveIsPremium && !hasCredits && !isUnlimited) {
          // Check if they are trying to use a free generation?
          // Usually, logged in users have exhausted "Anonymous Trial".
          // If we give logged in users specifically allocated free generations, check logic here.
          // Currently assuming: Logged in = Uses Credits or Plan.
          // If you want to allow a free tier for logged in users, logic goes here.
          // For now, blocking if no credits/plan.
          return NextResponse.json(
            { error: "You have run out of credits. Please upgrade your plan." },
            { status: 403 }
          );
        }
      }
    } else {
      // Anonymous User - Rate Limit Only
      // Ensure we don't accidentally attribute this to a spoofer
      authorizedUserId = null;
    }

    // Rate limiting (Secondary Defense)
    const clientId = getClientIdentifier(request);
    // Trust DB over Header for IsPremium
    const rateLimit = checkRateLimit(clientId, "generate", effectiveIsPremium);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": effectiveIsPremium ? "100" : "5",
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
    let superParsedData: any = null; // Store high-quality parsed data
    try {
      // SUPER PARSER: Multi-modal extraction (Text + Visual + OCR)
      // This guarantees "100/100" accuracy by seeing what the human sees
      const { superParseResume } = await import("@/lib/super-parser");
      console.log("🚀 Starting Super Parser Pipeline...");

      // Get ALL artifacts from the Super Parser
      const { parsed, ocrText, images } = await superParseResume(pdfBuffer);

      // Store artifacts for later use in Generation
      (global as any).processingArtifacts = { ocrText, images, parsed };
      superParsedData = parsed;

      // Serialize to JSON string for the generator prompt
      // The generator prompt understands JSON perfectly
      resumeText = JSON.stringify(parsed, null, 2);

      console.log(`✅ Super Parser success. Extracted ${resumeText.length} chars of structured data.`);

    } catch (parseError: any) {
      console.error("❌ Super Parser failed:", parseError);

      // ABSOLUTE FALLBACK: Simple Text Extraction
      // Only runs if the entire Super Parser (including its internal fallbacks) dies
      try {
        const { parseResumePDF } = await import("@/lib/pdf-parser");
        const parsed = await parseResumePDF(pdfBuffer);
        resumeText = parsed.text;
        console.log("⚠️ Fallback to basic text parser successful");
      } catch (fallbackError) {
        return NextResponse.json(
          { error: "Failed to read PDF. The file seems corrupted or unreadable." },
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

    // STAGE 1.5: AI-Powered Deep Cleaning (The "AI Consistency Agent")
    // This fixes "Artificiai", "T e c h", and other deep OCR issues that regex misses
    console.log("=".repeat(50));
    console.log("STAGE 1.5: Running AI Cleaner Agent");
    console.log("=".repeat(50));

    let aiCleanedText = cleanResumeFormatted;
    try {
      const { cleanResumeTextWithAI } = await import("@/lib/ai-cleaner");
      aiCleanedText = await cleanResumeTextWithAI(cleanResumeFormatted);
      console.log("✅ AI Cleaning Complete");
    } catch (e) {
      console.error("⚠️ AI Cleaning skipped due to error:", e);
    }

    // Use the potentially AI-cleaned text for generation
    const finalResumeText = aiCleanedText;
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

    // STAGE 2: Generate Resume
    console.log("=".repeat(50));
    console.log("STAGE 2: Generating Resume with AI");
    console.log("=".repeat(50));

    // Calculate actual experience to prevent hallucinations
    let calculatedExperience = { totalYears: 0, details: "unknown" };
    try {
      // Use the Experience section if available, otherwise full text (but full text might pick up education dates)
      // Best approach: Use structured "Experience" section if it exists and is long enough
      let experienceText = structuredResume.sections["EXPERIENCE"] ||
        structuredResume.sections["WORK EXPERIENCE"] ||
        structuredResume.sections["EMPLOYMENT"] ||
        finalResumeText;

      calculatedExperience = calculateTotalExperience(experienceText);
      console.log(`✅ Calculated Experience: ${calculatedExperience.totalYears} years (${calculatedExperience.details})`);
    } catch (e) {
      console.error("Failed to calculate experience:", e);
    }

    // PREMIUM resume generation prompt - Highest quality output
    const resumePrompt = `You are an elite executive resume writer (Expert) with 25+ years of experience helping candidates secure positions at Fortune 500 companies, FAANG, and top-tier organizations. Your resumes consistently pass ATS systems and impress C-level executives.

TASK: Create a COMPLETE, PREMIUM, ATS-optimized resume that maximizes interview opportunities and showcases the candidate as an exceptional fit.

CRITICAL: Generate a COMPLETE resume with ALL sections filled out. Do NOT use placeholders like "[Company Name]", "[Your Name]", or "[Optional]". Use actual information from the original resume provided below.

CRITICAL REQUIREMENTS FOR MAXIMUM QUALITY:

1. **STRICT DATA INTEGRITY (ZERO HALLUCINATIONS)**:
   - **SOURCE OF TRUTH**: The Content is derived **ONLY** from the [ORIGINAL RESUME]. The [Job Description] is for **FILTERING/PRIORITIZATION ONLY**.
   - **ABSOLUTE BAN**: DO NOT include any skill, language, or certification just because it is in the Job Description. If the candidate does not have it, OMIT IT.
   - **Languages**: List **ONLY** languages explicitly found in the [ORIGINAL RESUME]. DO NOT COPY "Beneficial" or "Optional" languages from the JD. If the resume lists "English", "Hindi", output ONLY "English", "Hindi".
   - **Education**: If the input has no education, do NOT create an Education section.
   - **No Placeholders**: Never use "[Not provided]". Omit missing fields.

2. **ATS Optimization (Critical)**:
   - Use EXACT standard section headers in THIS ORDER:
     1. "Professional Summary"
     2. "Professional Experience"
     3. "Education"
     4. "Technical Skills"
     5. "Certifications" (if any)
   
   - **DO NOT** include the Name, Email, Phone, or Location at the top. These are managed separately by the system.
   - **START** the output directly with the Markdown comment: <!-- Name and Contact Info are managed in the Form above. Edit them there. -->
   - Followed by the Professional Summary.
     6. "Projects" (if any)
   - NO tables, columns, graphics, or complex formatting (ATS Death Traps)
   - Use simple, clean bullet points (•)
   - Include ALL relevant keywords naturally: ${keywords.slice(0, 40).join(", ")}
   - **KEYWORD DENSITY STRATEGY**: Ensure top 5 skills appear at least 3 times across the resume.

2. **Content Excellence (95+ Score Requirement)**:
   - **METRIC DENSITY RULE**: Every single bullet point MUST contain a number, %, or $. No exceptions.
   - **Action Verbs**: Start every bullet with a distinct Power Verb (e.g. "Orchestrated", "Engineered", not "Responsible for").
   - **Context-Action-Result (CAR)**: "Context (Situation) -> Action (What you did) -> Result (Metric)".
   - **Avoid Clichés**: Do NOT use "hard worker", "team player", "synergy". Use "Collaborative Leader", "High-Performance Contributor".

2. **Content Excellence**:
   - Start each bullet with POWER action verbs: Architected, Spearheaded, Orchestrated, Transformed, Accelerated, Optimized, Delivered, etc.
   - EVERY bullet MUST include quantifiable metrics: numbers, percentages, dollar amounts, timeframes
   - Use the STAR method (Situation, Task, Action, Result) structure
   - Show progression and impact, not just duties
   - Highlight leadership, innovation, and measurable business impact
   - Match each experience point to job requirements

3. **Professional Summary (MANDATORY)**:
   - You MUST generate a "Professional Summary" section at the top.
   - 3-4 lines maximum.
   - Synthesis of: Years of Experience + Key Achievement + Top JD Keyword Match.
   - Example data: "Results-driven [Role] with [X] years of experience... Expert in [Skill 1], [Skill 2]."
   - **DO NOT** omit this section.

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
0. **PRESERVE ORIGINAL NAMES EXACTLY**: 
   - **CRITICAL**: Keep Job Titles and Company Names EXACTLY as they appear in the original resume.
   - Do NOT add spaces to company names (if original says "HighbrowTechnologyInc", keep it as "HighbrowTechnologyInc").
   - Do NOT modify formatting of names (if original has no space, do NOT add space).
   - Only fix obvious typos that would embarrass the candidate (e.g., "Gogle" → "Google").
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

Example Education Entry:
### Bachelor of Science in Computer Science
**University of California** | Berkeley, CA | 2018 - 2022

CRITICAL EDUCATION FORMATTING:
- Degree Name must be the Header (###)
- Insitution Name must be the Sub-header line (** Institution **)
- DO NOT stack them both as bold lines.

CRITICAL REQUIREMENTS:
- Generate a COMPLETE resume with ALL information filled in (2 pages worth of content)
- Use actual company names, job titles, dates, and achievements from the original resume
- Do NOT leave any placeholders or empty sections
- Include ALL relevant experience, education, and skills from the original resume
- Make it comprehensive and complete
- Every section must be fully populated with real information
- If the original resume contains multiple roles or sections, include every one of them (do not summarize them away)

**CRITICAL: ABSOLUTELY NO DUPLICATE ROLES**:
- BEFORE generating, scan the entire original resume to identify unique roles.
- Each unique combination of (Role Title + Company + Date Range) must appear EXACTLY ONCE.
- If the same role appears multiple times in the input (due to OCR/parsing issues), MERGE all bullet points into ONE entry.
- NEVER output "### Video Annotator" twice for the same company.
- If a role has incomplete info (no dates or bullets), MERGE it with the complete version.
- Count your experience entries before outputting - each role should appear ONCE only.

- If a role implies multiple projects, list them as bullet points under ONE role entry.

CRITICAL: Output ONLY the markdown content. Do NOT wrap it in code blocks. Output raw markdown text directly without any code block markers. Generate the COMPLETE resume now.`;

    // Generate resume with retry logic
    let generatedResume: string;
    // STAGE 3: Construct Verification Report
    // This is the "Truth Anchor" for the AI
    const verificationReport = {
      totalExperience: calculatedExperience.totalYears,
      experienceDetails: calculatedExperience.details,
      detectedSkills: keywords.slice(0, 15), // Top 15 detected skills
      constraints: [
        calculatedExperience.totalYears < 3 ? "Do NOT use 'Senior', 'Lead', or 'Expert' in title/summary" : "Allowed to use Seniority terms if applicable",
        "Do NOT invent new companies or job titles",
        "Must use exact dates from resume"
      ]
    };

    try {
      const { generateMultimodal } = await import("@/lib/gemini");

      // Retrieve artifacts (OCR, Images) from the parser scope
      const artifacts = (global as any).processingArtifacts || { ocrText: "", images: [] };
      const { ocrText, images } = artifacts;

      const systemPrompt = `
    You are an elite Resume Reconstruction & Optimization AI. 
    
    ### THE "4-LAYER VERIFICATION" PROTOCOL:
    You are provided with FOUR inputs:
    
    1. **VISUAL IMAGES** (Attached): High-res screenshots of every page. Use these for LAYOUT, DATES, and SECTION HIERARCHY.
    2. **VISUAL PDF** (Attached): The raw file.
    3. **OCR TEXT** (Below): Extracted text from the images.
    4. **PARSED JSON** (Below): Structured data extracted by a specialized parser.
    5. **EXTRACTED TEXT** (The raw PDF text): Use for copy-paste accuracy.
    
    ### YOUR MISSION:
    Reconstruct the resume by CROSS-REFERENCING all inputs.
    - **Visual Check**: Look at the IMAGES. Does "Project Manager" look like a Job Title (Bold/Large) or a sub-bullet? Trust the Visual Layout for hierarchy.
    - **Text Check**: If the visual text is blurry, use the Extracted/OCR Text.
    
    ### TRUTH VERIFICATION REPORT:
    - **Confirmed Experience**: ${verificationReport.totalExperience} years.
    - **Constraint Checklist**:
      ${verificationReport.constraints.map(c => `- [ ] ${c}`).join('\n      ')}
    
    CRITICAL RULE: **NO HALLUCINATION**.
    
    ### MENTAL SANDBOX (REQUIRED):
    Wrap your analysis in a <thinking> block.
    1. **Visual Scan**: I see X number of distinct roles in the PDF images.
    2. **Role Verification**: "Project Lead" is a title, not a bullet.
    3. **Strategy**: How to optimize this for the target job?
    </thinking>
    
    Then, output the final Markdown Resume.
    `;

      // Prepare Multimodal Payload (Images + PDF)
      const multimodalPayload: { mimeType: string; data: string }[] = [];

      // 1. Add Page Images (Visual Layer)
      if (images && Array.isArray(images)) {
        images.forEach((img: string) => {
          multimodalPayload.push({
            mimeType: "image/png",
            data: img.replace(/^data:image\/\w+;base64,/, "")
          });
        });
      }

      // 2. Add Raw PDF (File Layer)
      multimodalPayload.push({ mimeType: "application/pdf", data: base64Data });

      const multimodalPrompt = `${resumePrompt}
      
      --------------------------------------------------
      ADDITIONAL INPUT 1: OCR TEXT FROM IMAGES
      ${ocrText || "No OCR available"}
      --------------------------------------------------
      ADDITIONAL INPUT 2: RAW TEXT / PARSED DATA
      ${finalResumeText}
      --------------------------------------------------
      `;

      generatedResume = await retry(
        () =>
          generateMultimodal(
            multimodalPrompt,
            multimodalPayload,
            systemPrompt
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
    let suggestedThemeId = "professional"; // Default

    // Remove <thinking> block if present
    const thinkingMatch = cleanResume.match(/<thinking>[\s\S]*?<\/thinking>/);
    if (thinkingMatch) {
      console.log("AI Mental Sandbox Strategy:", thinkingMatch[0]); // Log the strategy

      // Extract Theme
      const themeMatch = thinkingMatch[0].match(/Theme:\s*([a-zA-Z]+)/i);
      if (themeMatch && themeMatch[1]) {
        suggestedThemeId = themeMatch[1].toLowerCase();
        console.log("AI Suggested Theme:", suggestedThemeId);
      }

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

    // Generate cover letter if requested
    let generatedCoverLetter: string | null = null;
    if (includeCoverLetter) {
      try {
        const coverLetterPrompt = `You are an elite cover letter writer. Create a compelling, personalized cover letter.

CANDIDATE INFO:
Name: ${normalizedResume.name || "Candidate"}
Email: ${normalizedResume.email || ""}
Phone: ${normalizedResume.phone || ""}

TARGET JOB:
Position: ${parsedJob.title || "the position"}
Company: ${parsedJob.company || companyName || "the company"}

JOB DESCRIPTION:
${sanitizedJobDescription.substring(0, 3000)}

RESUME SUMMARY:
${cleanResume.substring(0, 2000)}

INSTRUCTIONS:
1. Write a professional, 3-4 paragraph cover letter
2. Opening: Express genuine interest in the specific role and company
3. Body: Highlight 2-3 key achievements from resume that match job requirements
4. Use specific metrics and accomplishments from the resume
5. Closing: Strong call to action expressing enthusiasm for interview
6. Keep it concise (250-350 words)
7. Personalize to the company and role - don't be generic
8. Professional yet engaging tone
9. DO NOT use any placeholders like [Company Name] - use actual information

Generate the cover letter now:`;

        generatedCoverLetter = await generateText(coverLetterPrompt, "You are an expert cover letter writer creating compelling, personalized cover letters.", {
          temperature: 0.5,
          maxOutputTokens: 2000,
        });

        generatedCoverLetter = cleanMarkdownContent(generatedCoverLetter);
      } catch (coverLetterError) {
        console.error("Cover letter generation error:", coverLetterError);
        // Don't fail the whole request, just skip cover letter
      }
    }

    // ============================================
    // STAGE 6: GENERATION COMPLETE (Preview Only)
    // ============================================
    console.log("=".repeat(50));
    console.log("STAGE 6: GENERATION COMPLETE (Preview Only - PDF available via Download)");
    console.log("=".repeat(50));

    // PDF Buffers are NULL here because we don't generate them until payment/download click
    // This saves compute and ensures security
    let resumePdfBuffer: Buffer | null = null;
    let atsResumePdfBuffer: Buffer | null = null;

    // Calculate score of the GENERATED resume
    let generatedScore = null;
    try {
      const { calculateResumeScore } = await import("@/lib/resume-scorer");
      // Stitch header + body for accurate scoring
      // Stitch header + body for accurate scoring
      // Prefer contactOverrides (from user input in UI) over parsed data
      const scoringName = contactOverrides?.fullName || normalizedResume.name || structuredResume.name || "Candidate Name";
      const scoringEmail = contactOverrides?.email || normalizedResume.email || structuredResume.email || "candidate@email.com";
      const scoringPhone = contactOverrides?.phone || normalizedResume.phone || structuredResume.phone || "555-555-5555";
      const scoringLinkedin = contactOverrides?.linkedin || normalizedResume.linkedin || "linkedin.com/in/candidate";
      const scoringLocation = contactOverrides?.location || normalizedResume.location || "City, State";

      const fullTextForScoring = `
${scoringName} | ${scoringEmail} | ${scoringPhone} | ${scoringLinkedin} | ${scoringLocation}
${cleanResume}
      `.trim();
      generatedScore = calculateResumeScore(fullTextForScoring);
    } catch (e) {
      console.error("Failed to score generated resume", e);
    }

    const response = NextResponse.json({
      resume: {
        markdown: cleanResume,
        pdf: null, // PDF moved to secure download endpoint
        atsPDF: null,
      },
      coverLetter: generatedCoverLetter,
      meta: {
        ...structuredResume,
        name: (superParsedData?.name) || normalizedResume.name,
        email: (superParsedData?.email) || normalizedResume.email,
        phone: (superParsedData?.phone) || normalizedResume.phone,
        location: (superParsedData?.location) || normalizedResume.location,
        linkedin: (superParsedData?.linkedin) || normalizedResume.linkedin,
        github: normalizedResume.github,
        website: normalizedResume.website,
        score: generatedScore, // Return the NEW score
      },
      parsedJob: {
        title: parsedJob.title,
        company: parsedJob.company,
        location: parsedJob.location,
        workMode: parsedJob.workMode,
      },
      suggestedTheme: suggestedThemeId, // AI suggestion
      cached: false,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });

    // Log the successful generation data
    // Note: Credits are now deducted ONLY on download (in /api/download-pdf)
    logGenerationData({
      clientId,
      isPremium: effectiveIsPremium,
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
        userId: authorizedUserId || null,
        jobTitle: parsedJob.title,
        companyName: parsedJob.company,
        jobLocation: parsedJob.location,
        resumeContent: cleanResume,
        coverLetterContent: generatedCoverLetter,
        originalResumeText: finalResumeText?.substring(0, 5000), // Truncate for storage
        jobDescriptionText: jobDescription?.substring(0, 5000),
        isFreeGeneration: !effectiveIsPremium,
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
