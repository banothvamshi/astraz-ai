/**
 * Premium job description parser and analyzer
 * Enhanced with better extraction for company, title, location, work mode, salary
 */

export interface ParsedJobDescription {
  title?: string;
  company?: string;
  location?: string;
  workMode?: "remote" | "hybrid" | "onsite" | "unknown";
  salaryRange?: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  experience?: string;
  education?: string;
  benefits?: string[];
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
    /(?:Job\s*Title|Position|Role|Title)\s*[:|-]?\s*([^\n]+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Engineer|Developer|Designer|Manager|Director|Analyst|Architect|Specialist|Scientist|Consultant|Lead|Senior|Junior|Staff))/i,
    /^((?:Senior|Lead|Staff|Principal|Junior)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    // Additional patterns for common job posting formats
    /^([\w\s]+(?:Representative|Coordinator|Administrator|Specialist|Associate|Officer))/i,
    /^(.+?)\s*[-–|]\s*(?:Full\s*Time|Part\s*Time|Contract|Remote|Hybrid)/i,
  ];
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/[:|].*$/, '').trim();
      if (candidate.length > 5 && candidate.length < 80) {
        title = candidate;
        break;
      }
    }
  }

  // Fallback: Check first 5 lines for short, capitalized lines that look like titles
  if (!title) {
    const titleHints = [
      "Engineer", "Developer", "Designer", "Manager", "Director", "Analyst",
      "Architect", "Specialist", "Scientist", "Consultant", "Lead", "Administrator",
      "Coordinator", "Associate", "Executive", "Officer", "Representative",
      "CSR", "Contact", "Center", "Support", "Customer", "Service"
    ];
    const candidateLine = lines.slice(0, 7).find((line) =>
      titleHints.some((hint) => line.toLowerCase().includes(hint.toLowerCase())) &&
      line.length < 100
    );
    if (candidateLine) {
      title = candidateLine.replace(/\s+at\s+.+$/i, "").replace(/[|-].*$/, "").trim();
    }
  }

  // Ultimate fallback: Use first line if it's reasonably short
  if (!title && lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 60 && !firstLine.match(/^\d/) && !firstLine.includes("@")) {
      title = firstLine.replace(/[:|].*$/, "").trim();
    }
  }

  // Enforce max length - truncate if too long
  if (title && title.length > 60) {
    title = title.substring(0, 55).trim() + "...";
  }

  // Extract company name - enhanced patterns
  let company: string | undefined;
  const companyPatterns = [
    /(?:Company|Organization|Employer|Hiring\s*Manager\s*at)\s*[:|-]?\s*([^\n]+)/i,
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s*[-|]|\s*$)/,
    /(?:Join|Work\s+(?:at|with|for))\s+([A-Z][A-Za-z0-9\s&]+)/i,
    /(?:About\s+)?([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)\s+is\s+(?:looking|seeking|hiring)/i,
    /^([A-Z][A-Za-z0-9\s&]+)\s+[-|]\s+/,
    // Additional patterns
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|LLC|Ltd|Corp|Corporation|Limited|Co\.|Company)/i,
    /\b([A-Z][a-z]+(?:[A-Z][a-z]+)*)\s+(?:Technologies|Solutions|Services|Systems|Group)/i,
  ];
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Validate it's not a title or common word
      const blacklist = ['engineer', 'developer', 'manager', 'senior', 'junior', 'lead', 'we', 'are', 'the', 'this', 'is', 'a'];
      if (!blacklist.includes(candidate.toLowerCase()) && candidate.length > 2 && candidate.length < 60) {
        company = candidate;
        break;
      }
    }
  }

  // Enforce max length for company
  if (company && company.length > 50) {
    company = company.substring(0, 45).trim() + "...";
  }

  // Extract location - enhanced with city/state detection
  let location: string | undefined;
  const locationPatterns = [
    /(?:Location|Office|Based\s+in|Work\s+Location)\s*[:|-]?\s*([^\n]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z]{2}|[A-Z][a-z]+))/,  // City, State
    /([A-Z][a-z]+,\s*[A-Z][a-z]+,?\s*(?:India|USA|UK|Canada|Germany|Australia)?)/i,
  ];
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const loc = match[1].trim();
      if (loc.length > 3 && loc.length < 60) {
        location = loc;
        break;
      }
    }
  }

  // Extract work mode (remote/hybrid/onsite)
  let workMode: "remote" | "hybrid" | "onsite" | "unknown" = "unknown";
  const workModePatterns = [
    { pattern: /\b(?:fully\s*)?remote\b/i, mode: "remote" as const },
    { pattern: /\b(?:100%?\s*)?remote\b/i, mode: "remote" as const },
    { pattern: /\bwork\s*from\s*home\b/i, mode: "remote" as const },
    { pattern: /\bhybrid\b/i, mode: "hybrid" as const },
    { pattern: /\b(?:on-?site|in-?office|in\s*person)\b/i, mode: "onsite" as const },
  ];
  for (const { pattern, mode } of workModePatterns) {
    if (pattern.test(text)) {
      workMode = mode;
      break;
    }
  }

  // Extract salary range
  let salaryRange: string | undefined;
  const salaryPatterns = [
    /(?:Salary|Compensation|Pay)\s*[:|-]?\s*([^\n]+)/i,
    /\$[\d,]+\s*[-–to]+\s*\$[\d,]+(?:\s*(?:per\s*)?(?:year|yr|annually|month|mo))?/i,
    /(?:₹|Rs\.?|INR)\s*[\d,]+(?:\s*[-–to]+\s*(?:₹|Rs\.?|INR)?\s*[\d,]+)?(?:\s*(?:LPA|per\s*annum|per\s*month))?/i,
    /[\d]+[kK]\s*[-–to]+\s*[\d]+[kK](?:\s*(?:USD|EUR|GBP|INR))?/i,
  ];
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      salaryRange = match[0].trim();
      break;
    }
  }

  // Extract skills (expanded list)
  const skills: string[] = [];
  const skillKeywords = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Shell", "Bash", "PowerShell",
    // Frontend
    "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js", "jQuery", "HTML", "CSS", "SASS",
    "Tailwind", "Bootstrap", "Material UI", "Redux", "MobX", "GraphQL",
    // Backend
    "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Spring Boot", "Rails",
    "ASP.NET", "Laravel", "Symfony", "NestJS", "Koa",
    // Databases
    "SQL", "PostgreSQL", "MongoDB", "Redis", "MySQL", "SQLite", "Oracle", "DynamoDB",
    "Cassandra", "Elasticsearch", "Firebase", "Supabase",
    // Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD", "Jenkins", "GitHub Actions",
    "Terraform", "Ansible", "Linux", "Nginx", "Apache",
    // AI/ML
    "Machine Learning", "AI", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
    "Data Science", "Analytics", "Pandas", "NumPy", "Scikit-learn", "LLM", "GPT",
    // Methodologies
    "Agile", "Scrum", "DevOps", "Microservices", "REST", "RESTful", "API", "SOA",
    // Tools
    "Jira", "Confluence", "Slack", "Figma", "Sketch", "Adobe XD", "Postman", "VSCode",
  ];

  const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  for (const keyword of skillKeywords) {
    try {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");
      if (regex.test(text) && !skills.includes(keyword)) {
        skills.push(keyword);
      }
    } catch {
      if (text.toLowerCase().includes(keyword.toLowerCase()) && !skills.includes(keyword)) {
        skills.push(keyword);
      }
    }
  }

  // Extract requirements
  const requirements: string[] = [];
  const requirementSection = extractSection(text, [
    "REQUIREMENTS", "QUALIFICATIONS", "MUST HAVE", "REQUIRED",
    "WHAT YOU BRING", "WHAT WE'RE LOOKING FOR", "IDEAL CANDIDATE",
    "BASIC QUALIFICATIONS", "MINIMUM QUALIFICATIONS"
  ]);
  if (requirementSection) {
    const reqLines = requirementSection
      .split("\n")
      .map(l => l.trim().replace(/^[-•*]\s*/, ''))
      .filter((line) => line.length > 10);
    requirements.push(...reqLines.slice(0, 15)); // Limit to 15
  }

  // Extract responsibilities
  const responsibilities: string[] = [];
  const respSection = extractSection(text, [
    "RESPONSIBILITIES", "DUTIES", "WHAT YOU'LL DO",
    "KEY RESPONSIBILITIES", "WHAT YOU WILL DO", "YOUR ROLE",
    "DAY TO DAY", "IN THIS ROLE"
  ]);
  if (respSection) {
    const respLines = respSection
      .split("\n")
      .map(l => l.trim().replace(/^[-•*]\s*/, ''))
      .filter((line) => line.length > 10);
    responsibilities.push(...respLines.slice(0, 15)); // Limit to 15
  }

  // Extract experience requirement
  let experience: string | undefined;
  const expPatterns = [
    /(\d+)\s*[-–+to]+\s*(\d+)?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)?/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:Senior|Mid-level|Junior|Entry-level|Staff|Principal|Lead)\s*(?:level)?/i,
  ];
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      experience = match[0].trim();
      break;
    }
  }

  // Extract education requirement
  let education: string | undefined;
  const eduPatterns = [
    /(?:Bachelor['']?s?|Master['']?s?|PhD|Ph\.?D\.?|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?B\.?A\.?)[\s\w]*(?:in|of)?[\s\w]*/i,
    /(?:Degree|Diploma)[\s\w]+(?:in|of)[\s\w]+/i,
    /(?:Computer Science|Engineering|Information Technology|Business|Mathematics)/i,
  ];
  for (const pattern of eduPatterns) {
    const match = text.match(pattern);
    if (match) {
      education = match[0].trim().substring(0, 100); // Limit length
      break;
    }
  }

  // Extract benefits
  const benefits: string[] = [];
  const benefitsSection = extractSection(text, [
    "BENEFITS", "PERKS", "WHAT WE OFFER", "WHY JOIN",
    "COMPENSATION", "WE OFFER"
  ]);
  if (benefitsSection) {
    const benefitLines = benefitsSection
      .split("\n")
      .map(l => l.trim().replace(/^[-•*]\s*/, ''))
      .filter((line) => line.length > 5);
    benefits.push(...benefitLines.slice(0, 10));
  }

  return {
    title,
    company,
    location,
    workMode,
    salaryRange,
    skills,
    requirements,
    responsibilities,
    experience,
    education,
    benefits,
    fullText: text,
  };
}

/**
 * Extract a specific section from job description
 */
function extractSection(text: string, sectionNames: string[]): string | null {
  for (const sectionName of sectionNames) {
    // Try to find section header and extract content until next section
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`(?:^|\\n)\\s*(?:#{1,3}\\s*)?${escapedName}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\s*(?:#{1,3}\\s*)?[A-Z][A-Z\\s]{2,}[:\\s]*\\n|$)`, "i"),
      new RegExp(`${escapedName}[\\s:]*\\n([\\s\\S]*?)(?=\\n\\n[A-Z]{2,}|$)`, "i"),
    ];

    for (const regex of patterns) {
      const match = text.match(regex);
      if (match && match[1] && match[1].trim().length > 10) {
        return match[1].trim();
      }
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

  // Add title words
  if (parsed.title) {
    parsed.title.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 3) keywords.add(w);
    });
  }

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
    "cross-functional", "ownership", "scalable", "performance", "optimization",
  ];

  const lowerText = jobDescription.toLowerCase();
  commonKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      keywords.add(keyword);
    }
  });

  return Array.from(keywords);
}

/**
 * Get a summary of the parsed job for display
 */
export function getJobSummary(parsed: ParsedJobDescription): string {
  const parts: string[] = [];

  if (parsed.title) parts.push(`**Position:** ${parsed.title}`);
  if (parsed.company) parts.push(`**Company:** ${parsed.company}`);
  if (parsed.location) parts.push(`**Location:** ${parsed.location}`);
  if (parsed.workMode && parsed.workMode !== "unknown") {
    parts.push(`**Work Mode:** ${parsed.workMode.charAt(0).toUpperCase() + parsed.workMode.slice(1)}`);
  }
  if (parsed.experience) parts.push(`**Experience:** ${parsed.experience}`);
  if (parsed.salaryRange) parts.push(`**Salary:** ${parsed.salaryRange}`);
  if (parsed.skills.length > 0) {
    parts.push(`**Key Skills:** ${parsed.skills.slice(0, 10).join(", ")}`);
  }

  return parts.join("\n");
}
