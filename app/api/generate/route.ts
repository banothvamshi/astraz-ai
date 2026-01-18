import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { parseResumePDF, extractResumeSections } from "@/lib/pdf-parser";
import { parseJobDescription, extractKeywords } from "@/lib/job-description-parser";

export async function POST(request: NextRequest) {
  try {
    // Parse request body with better error handling
    let body;
    try {
      body = await request.json();
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

    if (jobDescription.trim().length < 100) {
      return NextResponse.json(
        { error: `Job description is too short (${jobDescription.trim().length} characters). Please provide a complete job description (at least 100 characters).` },
        { status: 400 }
      );
    }

    // Validate resume is a string (base64)
    if (typeof resume !== "string") {
      return NextResponse.json(
        { error: "Invalid resume format. Please upload a valid PDF file." },
        { status: 400 }
      );
    }

    // Parse PDF with enhanced error handling
    let base64Data: string;
    try {
      // Handle data URL format (data:application/pdf;base64,...) or plain base64
      if (resume.includes(",")) {
        base64Data = resume.split(",")[1];
      } else {
        base64Data = resume;
      }

      // Validate base64 data exists
      if (!base64Data || base64Data.length === 0) {
        return NextResponse.json(
          { error: "Resume file appears to be empty. Please upload a valid PDF file." },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("Base64 parsing error:", error);
      return NextResponse.json(
        { error: "Invalid resume format. Please upload a valid PDF file." },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = Buffer.from(base64Data, "base64");
      
      // Validate buffer was created
      if (!pdfBuffer || pdfBuffer.length === 0) {
        return NextResponse.json(
          { error: "Failed to process resume file. The file may be corrupted." },
          { status: 400 }
        );
      }

      // Check if it's actually a PDF (PDF files start with %PDF)
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (!pdfHeader.startsWith("%PDF")) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload a PDF file (not an image or other format)." },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("Buffer creation error:", error);
      return NextResponse.json(
        { error: "Failed to process resume file. Please ensure it's a valid PDF." },
        { status: 400 }
      );
    }

    // Parse PDF with premium parser
    const parsedResume = await parseResumePDF(pdfBuffer);
    const resumeText = parsedResume.text;
    const resumeSections = extractResumeSections(resumeText);

    // Parse job description
    const parsedJob = parseJobDescription(jobDescription);
    const keywords = extractKeywords(jobDescription);

    // Premium resume generation prompt
    const resumePrompt = `You are a world-class resume writer and ATS optimization expert with 20+ years of experience. Your resumes help candidates land jobs at top companies.

TASK: Create a premium, ATS-optimized resume that will pass Applicant Tracking Systems and impress hiring managers.

CRITICAL REQUIREMENTS:
1. **ATS Optimization**: 
   - Use standard section headers: "Professional Summary", "Experience", "Education", "Skills", "Certifications"
   - NO tables, columns, or complex formatting
   - Use simple bullet points
   - Include relevant keywords naturally: ${keywords.slice(0, 20).join(", ")}

2. **Content Quality**:
   - Use action verbs: Led, Developed, Implemented, Optimized, Achieved, etc.
   - Include quantifiable achievements with numbers, percentages, and metrics
   - Highlight impact and results, not just responsibilities
   - Match experience to job requirements

3. **Professional Formatting**:
   - Clean, scannable layout
   - Consistent formatting throughout
   - Professional tone
   - No typos or grammatical errors

4. **Authenticity**:
   - Maintain candidate's actual experience and dates
   - Don't fabricate or exaggerate
   - Reorganize and rephrase for impact, but stay truthful

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${parsedJob.title ? `Position: ${parsedJob.title}` : ""}
${parsedJob.company ? `Company: ${parsedJob.company}` : ""}
${parsedJob.skills.length > 0 ? `Key Skills Needed: ${parsedJob.skills.join(", ")}` : ""}

Full Job Description:
${jobDescription}

Generate a premium, professional resume in markdown format. Structure it with clear sections and bullet points.`;

    const generatedResume = await generateText(
      resumePrompt,
      `You are an elite resume writer specializing in ATS optimization and executive-level resume writing. 
      Your resumes consistently help candidates secure positions at Fortune 500 companies.
      You understand both ATS systems and human recruiter psychology.
      Generate resumes that are both machine-readable and human-appealing.`,
      {
        temperature: 0.6, // Lower temperature for more consistent, professional output
        maxOutputTokens: 3000, // Increased for more detailed resumes
      }
    );

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

CANDIDATE INFORMATION:
${resumeSections.name ? `Name: ${resumeSections.name}` : ""}
${resumeSections.email ? `Email: ${resumeSections.email}` : ""}
Key Experience: ${resumeSections.sections["EXPERIENCE"]?.substring(0, 500) || resumeText.substring(0, 500)}

JOB DETAILS:
${parsedJob.title ? `Position: ${parsedJob.title}` : ""}
${parsedJob.company ? `Company: ${parsedJob.company}` : ""}
${parsedJob.location ? `Location: ${parsedJob.location}` : ""}

Full Job Description:
${jobDescription}

Generate a premium, personalized cover letter in markdown format.`;

    const generatedCoverLetter = await generateText(
      coverLetterPrompt,
      `You are an expert cover letter writer with a track record of helping candidates land interviews.
      Your cover letters are personalized, compelling, and demonstrate genuine interest.
      You avoid clichés and generic statements. Every sentence adds value.`,
      {
        temperature: 0.7,
        maxOutputTokens: 2000, // Increased for more detailed cover letters
      }
    );

    return NextResponse.json({
      resume: generatedResume,
      coverLetter: generatedCoverLetter,
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    
    // Provide helpful error messages
    if (error.message?.includes("PDF")) {
      return NextResponse.json(
        { error: error.message || "Failed to process PDF. Please ensure it's a valid, text-based PDF file." },
        { status: 400 }
      );
    }
    
    if (error.message?.includes("API key") || error.message?.includes("GOOGLE_GEMINI")) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 }
      );
    }
    
    if (error.message?.includes("rate limit") || error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to generate documents. Please try again." },
      { status: 500 }
    );
  }
}
