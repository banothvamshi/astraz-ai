/**
 * Advanced AI Prompt Engineering
 * Better thinking, career switch understanding, improved resume generation
 */

export function generateAdvancedATSPrompt(
  resumeData: string,
  jobDescription: string,
  userContext?: string,
  experienceYears?: number | string
): string {
  const expString = experienceYears ? (Number(experienceYears) > 0 ? `${experienceYears}+ years` : "early-career experience") : "relevant experience";

  return `You are an expert ATS (Applicant Tracking System) resume optimizer and career consultant.

IMPORTANT CONTEXT:
- The user may be making a CAREER SWITCH or changing industries
- Focus on TRANSFERABLE SKILLS that apply to the target role
- Highlight ANY relevant experience, even if from different fields
- Show how their experience solves problems in the target industry

CRITICAL DATA INTEGRITY RULES (ZERO HALLUCINATIONS):
- **SOURCE OF TRUTH**: The Content is derived **ONLY** from the USER'S RESUME/BACKGROUND. The [JOB DESCRIPTION] is for **FILTERING/PRIORITIZATION ONLY**.
- **ABSOLUTE BAN**: DO NOT include any skill, language, or certification just because it is in the Job Description. If the candidate does not have it, OMIT IT.
- **Experience Count**: You must state EXACTLY **"${expString}"** of experience in the Summary. **DO NOT** copy ranges like "0-3 years" or "5-7 years" from the Job Description.
- **Languages**: List **ONLY** languages explicitly found in the original resume.
- **No Placeholders**: Never use "[Not provided]". Omit missing fields.

JOB DESCRIPTION:
${jobDescription}

USER'S RESUME/BACKGROUND:
${resumeData}

${userContext ? `ADDITIONAL USER CONTEXT: ${userContext}` : ""}

YOUR TASK - Create a PERFECT ATS-OPTIMIZED Resume in MARKDOWN format:

1. ANALYZE THE JOB DESCRIPTION (Internal Process - DO NOT OUTPUT):
   - Extract: Required skills, experience, keywords, responsibilities
   - Identify: Nice-to-have vs Must-have requirements
   - Find: Industry-specific terminology and acronyms

2. MAP CANDIDATE SKILLS (Internal Process - DO NOT OUTPUT):
   - Highlight transferable skills
   - Reframe past experience for target role

3. OPTIMIZE FOR ATS:
   - Use standard section headings: # Professional Summary, ## Professional Experience, ## Education, ## Skills
   - No special characters (tables, columns)
   - Clear, scannable bullet points
   - Quantifiable achievements with metrics

4. REQUIRED SECTIONS (Markdown Format):
   - # [Candidate Name] -> Title
   - **[email] | [phone] | [location]** -> Contact line (use pipes)
   - # Professional Summary
     * **CRITICAL**: Start with "Results-driven [Role] with **${expString}** of experience...".
     * 2-3 lines highlighting most relevant skills.
   - # Professional Experience
     * For each role: ### Role at Company
     * **Date Range**
     * 4-5 bullet points with action verbs and metrics
   - # Education
     * Degree, Institution, Year
   - # Skills
     * Comma-separated lists by category

5. CRITICAL OUTPUT RULES:
- **OUTPUT ONLY THE MARKDOWN RESUME.**
- **DO NOT** output "Thinking...", "Here is the resume...", or any internal monologue.
- **DO NOT** use JSON.
- **DO NOT** use markdown code blocks (\`\`\`markdown). Just raw markdown text.
- Start directly with the Name header (# Name).

FORMAT YOUR RESPONSE AS RAW MARKDOWN.
`;
}

export function generateAdvancedCoverLetterPrompt(
  resumeData: string,
  jobDescription: string,
  candidateName: string
): string {
  return `You are an expert cover letter writer specializing in compelling, personalized letters that show genuine interest.

CANDIDATE INFORMATION:
Name: ${candidateName}

CANDIDATE'S RESUME:
${resumeData}

TARGET JOB DESCRIPTION:
${jobDescription}

YOUR TASK - Write a compelling cover letter:

1. OPENING PARAGRAPH (2-3 sentences):
   - Express genuine interest in the role and company
   - Mention a specific detail about the company (if possible from the job description)
   - Briefly state why you're a strong fit

2. MIDDLE PARAGRAPHS (2-3 paragraphs):
   - Highlight 2-3 most relevant achievements
   - Show how your skills directly address job requirements
   - If career switch: explain your transition and motivation
   - Use specific examples with metrics/results
   - Connect your experience to their needs

3. CLOSING PARAGRAPH:
   - Reiterate enthusiasm
   - Call to action (request for interview/meeting)
   - Thank them for consideration

STYLE GUIDELINES:
- Professional but personable tone
- Specific and detailed (not generic)
- Show personality and passion
- 3-4 short paragraphs maximum
- ~250-350 words
- Show research about the company/role
- No clichés or generic phrases

START WITH: "Dear Hiring Manager,"
END WITH: "Sincerely, [Name]"

Generate only the cover letter body (all paragraphs), starting with "Dear Hiring Manager," and ending with "Sincerely, [Name]"
`;
}

export function analyzeCareerSwitchContext(
  currentRole: string,
  targetRole: string,
  skills: string[]
): string {
  return `
Analyzing career switch from "${currentRole}" to "${targetRole}"

Transferable skills to emphasize:
${skills.slice(0, 10).join(", ")}

Key points for cover letter:
1. Acknowledge the career change honestly
2. Explain your motivation and genuine interest
3. Highlight how your unique background brings fresh perspective
4. Show continuous learning and skill development
5. Focus on transferable skills (problem-solving, leadership, communication, etc.)
6. Provide concrete examples of success in similar responsibilities
`;
}

export function improveResumeWithContext(resumeText: string): {
  shouldHighlightCareerChange: boolean;
  suggestedFocus: string[];
  improvements: string[];
} {
  const hasMultipleIndustries =
    (resumeText.match(/\b(engineer|developer|analyst|manager|coordinator)\b/gi) ||
      []
    ).length > 1;
  const hasEducation = resumeText.toLowerCase().includes("degree");
  const hasCertifications = resumeText.toLowerCase().includes("certif");
  const hasQuantifiableMetrics = /\d+%|\d+x|\$\d+k/i.test(resumeText);

  return {
    shouldHighlightCareerChange:
      hasMultipleIndustries && !hasQuantifiableMetrics,
    suggestedFocus: [
      "leadership and project management",
      "cross-functional collaboration",
      "problem-solving and analytical thinking",
      "communication and stakeholder management",
      "technical skills transfer",
    ],
    improvements: [
      hasEducation
        ? "Include relevant coursework or certifications"
        : "Consider listing relevant online courses",
      hasQuantifiableMetrics
        ? "Continue using metrics to quantify achievements"
        : "Add metrics and numbers to achievements",
      hasMultipleIndustries
        ? "Explicitly show how skills transfer across industries"
        : "Develop deeper skills in target industry",
    ],
  };
}
