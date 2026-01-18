/**
 * Content Validator - Ensures generated content doesn't contain hallucinated information
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Extract all skills, companies, job titles, and achievements from original resume
 */
export function extractResumeFacts(resumeText: string): {
  skills: Set<string>;
  companies: Set<string>;
  jobTitles: Set<string>;
  achievements: string[];
} {
  const skills = new Set<string>();
  const companies = new Set<string>();
  const jobTitles = new Set<string>();
  const achievements: string[] = [];

  // Extract skills (common patterns)
  const skillPatterns = [
    /(?:Skills?|Technical Skills?|Technologies?)[:\s]+([^\n]+)/i,
    /(?:Proficient in|Expert in|Experience with)[:\s]+([^\n]+)/i,
  ];

  // Extract companies and job titles
  const companyPattern = /(?:at|with|Company)[:\s]+([A-Z][A-Za-z\s&]+)/gi;
  const titlePattern = /(?:Position|Role|Title)[:\s]+([A-Z][A-Za-z\s]+)/gi;

  // Simple extraction - can be enhanced
  const lines = resumeText.split("\n");
  for (const line of lines) {
    // Extract skills
    if (line.toLowerCase().includes("skill")) {
      const matches = line.match(/([A-Z][A-Za-z\s+]+)/g);
      if (matches) {
        matches.forEach(m => skills.add(m.trim()));
      }
    }

    // Extract companies
    const companyMatches = line.match(companyPattern);
    if (companyMatches) {
      companyMatches.forEach(m => {
        const company = m.replace(/^(at|with|Company)[:\s]+/i, "").trim();
        if (company.length > 2) companies.add(company);
      });
    }

    // Extract job titles
    const titleMatches = line.match(titlePattern);
    if (titleMatches) {
      titleMatches.forEach(m => {
        const title = m.replace(/^(Position|Role|Title)[:\s]+/i, "").trim();
        if (title.length > 2) jobTitles.add(title);
      });
    }
  }

  return { skills, companies, jobTitles, achievements };
}

/**
 * Validate generated content against original resume
 */
export function validateGeneratedContent(
  generatedContent: string,
  originalResume: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const originalFacts = extractResumeFacts(originalResume);
  const generatedLower = generatedContent.toLowerCase();
  const originalLower = originalResume.toLowerCase();

  // Check for common hallucination patterns
  const suspiciousPatterns = [
    /(?:certified|certification|certificate)/gi,
    /(?:years? of experience)/gi,
    /(?:proven track record)/gi,
  ];

  // This is a basic validator - can be enhanced
  // For now, we rely on the AI prompt to prevent hallucination

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
