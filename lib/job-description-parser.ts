/**
 * Premium job description parser and analyzer
 */
export interface ParsedJobDescription {
  title?: string;
  company?: string;
  location?: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  experience?: string;
  education?: string;
  fullText: string;
}

/**
 * Parse and extract key information from job description
 */
export function parseJobDescription(jobDescription: string): ParsedJobDescription {
  const text = jobDescription.trim();
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  // Extract job title (usually in first few lines)
  let title: string | undefined;
  const titlePatterns = [
    /(?:Job Title|Position|Role|Title)[\s:]*([^\n]+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:-|–|—|at|@)/,
  ];
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      title = match[1].trim();
      break;
    }
  }
  if (!title) {
    const titleHints = [
      "Engineer",
      "Developer",
      "Designer",
      "Manager",
      "Director",
      "Analyst",
      "Architect",
      "Specialist",
      "Scientist",
      "Consultant",
    ];
    const candidateLine = lines.slice(0, 4).find((line) =>
      titleHints.some((hint) => line.toLowerCase().includes(hint.toLowerCase()))
    );
    if (candidateLine) {
      title = candidateLine.replace(/\s+at\s+.+$/i, "").trim();
    }
  }

  // Extract company name
  let company: string | undefined;
  const companyPatterns = [
    /(?:Company|Organization|Employer)[\s:]*([^\n]+)/i,
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&]+)/,
    /^[^@\n]+(?:at|@)\s+([A-Z][A-Za-z0-9\s&]+)/i,
    /(?:About|Who We Are|About Us)[\s:]*([A-Z][A-Za-z0-9\s&]+)/i,
  ];
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      company = match[1].trim();
      break;
    }
  }
  if (!company) {
    const atLine = lines.find((line) => /\s+(?:at|@)\s+/i.test(line));
    if (atLine) {
      const parts = atLine.split(/\s+(?:at|@)\s+/i);
      company = parts[1]?.trim();
    }
  }

  // Extract location
  let location: string | undefined;
  const locationPatterns = [
    /(?:Location|Location:)[\s:]*([^\n]+)/i,
    /(?:Remote|Hybrid|On-site)/i,
    /([A-Z][a-z]+,\s*[A-Z]{2})/,
  ];
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      location = match[1].trim();
      break;
    }
  }

  // Extract skills (common tech skills and keywords)
  const skills: string[] = [];
  const skillKeywords = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
    "React", "Vue", "Angular", "Node.js", "Express", "Next.js", "Django", "Flask",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD",
    "SQL", "PostgreSQL", "MongoDB", "Redis", "MySQL",
    "Machine Learning", "AI", "Data Science", "Analytics",
    "Agile", "Scrum", "DevOps", "Microservices",
  ];

  // Helper function to escape special regex characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  for (const keyword of skillKeywords) {
    try {
      // Escape special regex characters in keyword
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
      if (regex.test(text) && !skills.includes(keyword)) {
        skills.push(keyword);
      }
    } catch (regexError) {
      // If regex creation fails, use simple string matching as fallback
      if (text.toLowerCase().includes(keyword.toLowerCase()) && !skills.includes(keyword)) {
        skills.push(keyword);
      }
    }
  }

  // Extract requirements
  const requirements: string[] = [];
  const requirementSection = extractSection(text, ["REQUIREMENTS", "QUALIFICATIONS", "MUST HAVE", "REQUIRED", "WHAT YOU BRING"]);
  if (requirementSection) {
    const reqLines = requirementSection.split("\n").filter((line) => line.trim().length > 0);
    requirements.push(...reqLines);
  }

  // Extract responsibilities
  const responsibilities: string[] = [];
  const respSection = extractSection(text, ["RESPONSIBILITIES", "DUTIES", "WHAT YOU'LL DO", "KEY RESPONSIBILITIES", "WHAT YOU WILL DO"]);
  if (respSection) {
    const respLines = respSection.split("\n").filter((line) => line.trim().length > 0);
    responsibilities.push(...respLines);
  }

  // Extract experience requirement
  let experience: string | undefined;
  const expPatterns = [
    /(\d+)[\s-]+(\d+)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:Senior|Mid-level|Junior|Entry-level)/i,
  ];
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      experience = match[0];
      break;
    }
  }

  // Extract education requirement
  let education: string | undefined;
  const eduPatterns = [
    /(?:Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|Ph\.?D\.?)[\s\w]*in[\s\w]+/i,
    /(?:Degree|Diploma)[\s\w]+(?:in|of)[\s\w]+/i,
  ];
  for (const pattern of eduPatterns) {
    const match = text.match(pattern);
    if (match) {
      education = match[0];
      break;
    }
  }

  return {
    title,
    company,
    location,
    skills,
    requirements,
    responsibilities,
    experience,
    education,
    fullText: text,
  };
}

/**
 * Extract a specific section from job description
 */
function extractSection(text: string, sectionNames: string[]): string | null {
  const upperText = text.toUpperCase();
  for (const sectionName of sectionNames) {
    const regex = new RegExp(`${sectionName}[\\s:]*\\n([\\s\\S]*?)(?=\\n\\n[A-Z]{2,}|$)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract keywords from job description for ATS optimization
 */
export function extractKeywords(jobDescription: string): string[] {
  const parsed = parseJobDescription(jobDescription);
  const keywords = new Set<string>();

  // Add skills
  parsed.skills.forEach((skill) => keywords.add(skill.toLowerCase()));

  // Add requirements keywords
  parsed.requirements.forEach((req) => {
    const words = req
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3);
    words.forEach((word) => keywords.add(word));
  });

  // Add common ATS keywords
  const commonKeywords = [
    "leadership", "team", "collaboration", "communication", "problem solving",
    "analytical", "strategic", "innovative", "results-driven", "self-motivated",
    "detail-oriented", "time management", "project management", "stakeholder",
  ];

  const lowerText = jobDescription.toLowerCase();
  commonKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      keywords.add(keyword);
    }
  });

  return Array.from(keywords);
}
