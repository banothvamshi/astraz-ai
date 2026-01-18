/**
 * Advanced AI Prompt Engineering
 * Better thinking, career switch understanding, improved resume generation
 */

export function generateAdvancedATSPrompt(
  resumeData: string,
  jobDescription: string,
  userContext?: string
): string {
  return `You are an expert ATS (Applicant Tracking System) resume optimizer and career consultant.

IMPORTANT CONTEXT:
- The user may be making a CAREER SWITCH or changing industries
- Focus on TRANSFERABLE SKILLS that apply to the target role
- Highlight ANY relevant experience, even if from different fields
- Show how their experience solves problems in the target industry

JOB DESCRIPTION:
${jobDescription}

USER'S RESUME/BACKGROUND:
${resumeData}

${userContext ? `ADDITIONAL USER CONTEXT: ${userContext}` : ""}

YOUR TASK - Create a PERFECT ATS-OPTIMIZED Resume:

1. ANALYZE THE JOB DESCRIPTION:
   - Extract: Required skills, experience, keywords, responsibilities
   - Identify: Nice-to-have vs Must-have requirements
   - Find: Industry-specific terminology and acronyms

2. MAP CANDIDATE SKILLS:
   - Highlight transferable skills
   - Reframe past experience for target role
   - Use job description keywords throughout
   - Show relevance even for career changes

3. OPTIMIZE FOR ATS:
   - Include ALL relevant keywords from job posting
   - Use standard section headings: PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, EDUCATION, SKILLS
   - No special characters, tables, or formatting
   - Clear, scannable bullet points
   - Quantifiable achievements with metrics

4. GENERATE RESUME WITH:
   - Professional Summary (2-3 lines): Highlight most relevant skills and years of experience. Reference target role if career change.
   - Experience (for each role):
     * Job Title at Company
     * Duration/Dates
     * 4-5 bullet points with action verbs and metrics
     * Focus on achievements relevant to target role
   - Education: Degree, Institution, Year
   - Skills: Top 15-20 skills in priority order (most relevant first, include keywords from job posting)

5. CAREER SWITCH STRATEGY:
   - If changing careers, EXPLICITLY highlight how their background prepares them
   - Show continuous learning and skill development
   - Emphasize problem-solving and leadership that applies universally
   - Include any certifications, courses, or relevant projects

FORMAT YOUR RESPONSE AS:
---
[RESUME DATA IN JSON]
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "City, State",
  "summary": "Professional summary paragraph (2-3 sentences focused on target role)",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Month Year - Month Year",
      "description": "• Achievement with metric\\n• Responsibility with result\\n• Skill demonstrated with outcome"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Year",
      "details": "Optional GPA or honors"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}
---

REMEMBER:
✓ Make the resume ATS-friendly (plain text, no formatting)
✓ Include job posting keywords throughout
✓ Highlight quantifiable achievements
✓ Show career progression or skillset evolution
✓ For career switchers: explain the transition clearly
✓ Be honest - don't fabricate experience
✓ Use action verbs (Led, Developed, Managed, Optimized, etc.)
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
