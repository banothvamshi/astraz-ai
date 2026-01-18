import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { parseResumePDF, extractResumeSections } from "@/lib/pdf-parser";
import { parseJobDescription, extractKeywords } from "@/lib/job-description-parser";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { validatePDF, validateJobDescription, validateBase64, sanitizeJobDescription } from "@/lib/validation";
import { retry } from "@/lib/retry";

// Maximum execution time (25 seconds for Vercel)
const MAX_EXECUTION_TIME = 25000;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
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

    const { resume, jobDescription } = body;

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

    // Parse PDF with premium parser and retry logic
    let parsedResume;
    try {
      parsedResume = await retry(
        () => parseResumePDF(pdfBuffer),
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

    // Check cache first
    const cachedResponse = getCachedResponse(resumeText, sanitizedJobDescription);
    if (cachedResponse) {
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

    // Check execution time
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > MAX_EXECUTION_TIME - 5000) {
      return NextResponse.json(
        { error: "Request timeout. Please try again with a smaller file." },
        { status: 408 }
      );
    }

    // Premium resume generation prompt with enhanced instructions
    const resumePrompt = `You are a world-class resume writer and ATS optimization expert with 20+ years of experience. Your resumes help candidates land jobs at top companies.

TASK: Create a premium, ATS-optimized resume that will pass Applicant Tracking Systems and impress hiring managers.

CRITICAL REQUIREMENTS:
1. **ATS Optimization**: 
   - Use standard section headers: "Professional Summary", "Experience", "Education", "Skills", "Certifications"
   - NO tables, columns, or complex formatting
   - Use simple bullet points
   - Include relevant keywords naturally: ${keywords.slice(0, 30).join(", ")}

2. **Content Quality**:
   - Use action verbs: Led, Developed, Implemented, Optimized, Achieved, etc.
   - Include quantifiable achievements with numbers, percentages, and metrics
   - Highlight impact and results, not just responsibilities
   - Match experience to job requirements
   - Use industry-standard terminology

3. **Professional Formatting**:
   - Clean, scannable layout
   - Consistent formatting throughout
   - Professional tone
   - No typos or grammatical errors
   - Proper capitalization and punctuation

4. **Authenticity**:
   - Maintain candidate's actual experience and dates
   - Don't fabricate or exaggerate
   - Reorganize and rephrase for impact, but stay truthful
   - Preserve all important details

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${parsedJob.title ? `Position: ${parsedJob.title}` : ""}
${parsedJob.company ? `Company: ${parsedJob.company}` : ""}
${parsedJob.skills.length > 0 ? `Key Skills Needed: ${parsedJob.skills.join(", ")}` : ""}

Full Job Description:
${sanitizedJobDescription}

Generate a premium, professional resume in markdown format. Structure it with clear sections and bullet points. Ensure it's ATS-friendly and human-readable.`;

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
            Always maintain accuracy and authenticity.`,
            {
              temperature: 0.6,
              maxOutputTokens: 3000,
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
    const coverLetterPrompt = `You are a master cover letter writer who crafts compelling, personalized letters that get candidates interviews.

TASK: Write a premium cover letter that:
1. Opens with a strong, attention-grabbing hook
2. Demonstrates understanding of the company and role
3. Connects candidate's experience to job requirements
4. Shows enthusiasm and cultural fit
5. Ends with a confident call to action

CRITICAL REQUIREMENTS:
- Address it to: ${parsedJob.company || "Hiring Manager"}
- Reference the position: ${parsedJob.title || "the role"}
- Use specific examples from the resume
- Show knowledge of the company/industry
- Professional but warm tone
- 3-4 well-structured paragraphs
- No generic phrases like "I am writing to apply"
- Be concise but impactful

CANDIDATE INFORMATION:
${resumeSections.name ? `Name: ${resumeSections.name}` : ""}
${resumeSections.email ? `Email: ${resumeSections.email}` : ""}
Key Experience: ${resumeSections.sections["EXPERIENCE"]?.substring(0, 500) || resumeText.substring(0, 500)}

JOB DETAILS:
${parsedJob.title ? `Position: ${parsedJob.title}` : ""}
${parsedJob.company ? `Company: ${parsedJob.company}` : ""}
${parsedJob.location ? `Location: ${parsedJob.location}` : ""}

Full Job Description:
${sanitizedJobDescription}

Generate a premium, personalized cover letter in markdown format.`;

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
              temperature: 0.7,
              maxOutputTokens: 2000,
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

    // Cache the response
    try {
      setCachedResponse(resumeText, sanitizedJobDescription, {
        resume: generatedResume,
        coverLetter: generatedCoverLetter,
      });
    } catch (cacheError) {
      // Cache failure is not critical, continue
      console.error("Cache error:", cacheError);
    }

    return NextResponse.json({
      resume: generatedResume,
      coverLetter: generatedCoverLetter,
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
