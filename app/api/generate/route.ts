import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { parseResumePDF, extractResumeSections, ParsedResume } from "@/lib/pdf-parser";
import { parseResumePDFEnhanced, extractStructuredSections } from "@/lib/pdf-parser-enhanced";
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

    // Parse PDF using Document AI service with Google Document AI and fallback
    let parsedResume: ParsedResume;
    try {
      const { documentAIService } = await import('@/lib/document-ai-provider');
      parsedResume = await retry(
        () => documentAIService.parseResumePDF(pdfBuffer),
        {
          maxRetries: 2,
          initialDelay: 1000,
          retryableErrors: ["timeout", "network"],
        }
      );
    } catch (parseError: any) {
      console.error("PDF parsing error:", {
        error: parseError.message,
        bufferSize: pdfBuffer.length,
        pdfHeader: pdfBuffer.slice(0, 10).toString(),
        clientId,
      });

      return NextResponse.json(
        {
          error: parseError.message || "Failed to parse PDF. Please ensure it's a valid, text-based PDF file.",
          details: process.env.NODE_ENV === "development" ? parseError.message : undefined,
        },
        { status: 400 }
      );
    }

    const resumeText = parsedResume.text;
    const resumeSections = extractResumeSections(resumeText);
    const structuredResume = extractStructuredSections(resumeText);

    const hasGibberishLetters = (text: string): boolean => {
      if (!text || text.length < 50) return true;

      // Check for repeating single character pattern (like GGGGGGGG, BBBBBBB, etc.)
      // This indicates corrupted PDF extraction
      const lines = text.split('\n');
      let gibberishLineCount = 0;
      let totalNonEmptyLines = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;
        
        totalNonEmptyLines++;
        
        // Check if line is mostly a single repeated character
        const charCount: Record<string, number> = {};
        for (const char of trimmed) {
          if (char.match(/[A-Za-z0-9]/)) {
            charCount[char] = (charCount[char] || 0) + 1;
          }
        }
        
        const letterChars = Object.values(charCount).reduce((a, b) => a + b, 0);
        if (letterChars === 0) continue;
        
        const maxCount = Math.max(...Object.values(charCount));
        const repetitionRatio = maxCount / letterChars;
        
        // If one character makes up more than 70% of the line, it's likely gibberish
        if (repetitionRatio > 0.7) {
          gibberishLineCount++;
        }
      }

      // If more than 30% of lines are gibberish, reject the text
      if (totalNonEmptyLines > 0) {
        const gibberishRatio = gibberishLineCount / totalNonEmptyLines;
        if (gibberishRatio > 0.3) {
          return true;
        }
      }

      const tokens = text.split(/\s+/).filter(Boolean);
      if (tokens.length < 30) return true;

      const singleCharTokens = tokens.filter((t) => /^[A-Za-z]$/.test(t));
      const singleCharRatio = singleCharTokens.length / tokens.length;

      // Many PDFs break words into characters; treat it as gibberish only when it's overwhelming.
      // Avoid false positives by requiring both a high ratio AND a meaningful absolute count.
      return singleCharRatio > 0.55 && singleCharTokens.length > 200;
    };

    const hasPlaceholderTokens = (text: string): boolean => {
      if (!text) return false;
      return /\[[^\]]+\]/.test(text) || /Hiring Manager Name/i.test(text);
    };

    const sanitizeCoverLetter = (text: string, candidateName?: string): string => {
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

    if (hasGibberishLetters(resumeText)) {
      return NextResponse.json(
        {
          error:
            "We couldn't read your resume text correctly (it looks like an image-based/encoded PDF). Please upload a text-based resume PDF (selectable text) or export a fresh PDF from Word/Google Docs.",
          debug:
            process.env.NODE_ENV === "development"
              ? {
                  extractedChars: resumeText.length,
                  tokenCount: resumeText.split(/\s+/).filter(Boolean).length,
                  singleLetterTokenCount: resumeText
                    .split(/\s+/)
                    .filter(Boolean)
                    .filter((t: string) => /^[A-Za-z]$/.test(t)).length,
                  preview: resumeText.slice(0, 300),
                }
              : undefined,
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResponse = getCachedResponse(resumeText, sanitizedJobDescription);
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
   - ONLY include skills that are explicitly mentioned in the ORIGINAL RESUME CONTENT
   - DO NOT add skills from the job description if they are not in the original resume
   - Categorize existing skills: Technical Skills, Tools & Technologies, Soft Skills
   - Use exact terminology from the original resume
   - You can reorder and reorganize skills, but DO NOT add new ones

6. **Formatting & Style**:
   - Clean, professional, scannable layout
   - Consistent spacing and formatting
   - Professional tone throughout
   - Zero typos or grammatical errors
   - Proper capitalization (Title Case for headers, sentence case for content)
   - Use parallel structure in bullets

7. **CRITICAL - NO HALLUCINATION POLICY**:
   - ONLY use information that exists in the ORIGINAL RESUME CONTENT provided above
   - DO NOT add any skills, experiences, achievements, or qualifications that are NOT in the original resume
   - DO NOT invent companies, job titles, dates, or accomplishments
   - DO NOT add certifications, education, or projects that are not in the original resume
   - If a skill is mentioned in the job description but NOT in the original resume, DO NOT add it
   - You can rephrase and reorganize existing content, but you CANNOT add new content
   - If information is missing from the original resume, leave it out - do not invent it
   - Every bullet point, skill, and achievement MUST be traceable to the original resume content

ORIGINAL RESUME CONTENT:
${resumeText}

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
      generatedResume = await retry(
        () =>
          generateText(
            resumePrompt,
            `You are an elite resume writer specializing in ATS optimization and executive-level resume writing. 
            Your resumes consistently help candidates secure positions at Fortune 500 companies.
            You understand both ATS systems and human recruiter psychology.
            Generate resumes that are both machine-readable and human-appealing.
            
            CRITICAL RULE: You MUST ONLY use information from the original resume provided. 
            DO NOT add, invent, or hallucinate any skills, experiences, achievements, companies, 
            dates, certifications, or qualifications that are not explicitly stated in the original resume.
            Your job is to reorganize and rephrase existing content for maximum impact, NOT to add new content.`,
            {
              temperature: 0.4, // Lower for more consistent, professional output
              maxOutputTokens: 6000, // Increased significantly for complete, comprehensive resumes
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
Key Experience: ${resumeSections.sections["EXPERIENCE"]?.substring(0, 500) || resumeText.substring(0, 500)}

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

    generatedCoverLetter = sanitizeCoverLetter(generatedCoverLetter, candidateName);

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
    const cleanResume = cleanMarkdownContent(generatedResume);
    const cleanCoverLetter = cleanMarkdownContent(generatedCoverLetter);

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
    const resumeValidation = validateGeneratedContent(cleanResume, resumeText);
    if (!resumeValidation.valid && resumeValidation.errors.length > 0) {
      console.warn("Resume validation warnings:", resumeValidation.errors);
      // Log but don't fail - the prompt should prevent this
    }

    // Cache the response
    try {
      setCachedResponse(resumeText, sanitizedJobDescription, {
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
