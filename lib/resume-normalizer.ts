/**
 * Resume Normalizer
 * Converts raw parsed resume text into a clean, structured format
 */

export interface NormalizedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  professional_summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  projects: Project[];
  raw_text: string;
  unclassified_content?: string; // Content that didn't fit into standard sections
}

interface Experience {
  company: string;
  title: string;
  duration: string;
  start_date: string;
  end_date: string;
  description: string[];
  location?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
  gpa?: string;
  details?: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
}

/**
 * Common regex patterns - Enhanced for Enterprise Robustness
 */
const PATTERNS = {
  // RFC 5322 compliant-ish email (covers 99.9% of resumes)
  EMAIL: /([a-zA-Z0-9._-]+(\+[a-zA-Z0-9._-]+)?@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,

  // Phone: International formats, dots, dashes, spaces, extensions
  // e.g. +1 555-555-5555, 555.555.5555, (555) 555-5555, +91 9876543210
  PHONE: /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x)\.?\s*\d{1,5})?|\d{10,13}/,

  // Date formats: "Jan 2020", "01/2020", "2020", "Present"
  DATE: /((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\.,]?\s+\d{4}|\d{1,2}[\/-]\d{4}|\d{4}|Present|Current|Now)/i,

  // Date Range: "Jan 2020 - Present", "2018 to 2019"
  DATE_RANGE: /((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\.,]?\s+\d{4}|\d{1,2}[\/-]\d{4}|\d{4})\s*(?:[-–to]+)\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\.,]?\s+\d{4}|\d{1,2}[\/-]\d{4}|\d{4}|Present|Current|Now)/i,

  // LinkedIn URL patterns
  // LinkedIn URL patterns - Enhanced for incomplete URLs and text indicators
  LINKEDIN: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?/i,
  LINKEDIN_LOOSE: /linkedin(?:\.com)?(?:\/in)?\/([a-zA-Z0-9_-]+)/i, // Matches "linkedin/in/user" or "linkedin.com/in/user"
  LINKEDIN_TEXT: /linkedin\s*:?\s*([a-zA-Z0-9_-]{3,})/i, // Matches "LinkedIn: username"

  // GitHub URL patterns
  GITHUB: /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?/i,

  // Website / Portfolio URLs (generic)
  WEBSITE: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[\w.-]*)*\/?/i,

  // General URL pattern
  URL: /((?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[a-zA-Z0-9_-]+|github\.com\/[a-zA-Z0-9_-]+|gitlab\.com\/[a-zA-Z0-9_-]+|[a-zA-Z0-9-]+\.(?:com|io|dev|me|org|net)\/[\w-]*))/i,
};

/**
 * Extract candidate name from resume text
 */
function extractName(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  if (lines.length === 0) return '';

  // Look for first 5 lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    let line = lines[i].trim();

    // Skip technical headers only
    if (line.match(/^(resume|cv|curriculum|vitae|page|summary)/i)) {
      continue;
    }

    // Heuristic: Name is usually the first significant line that isn't an email/phone/url
    // But sometimes Name IS on the same line as contact info in bad parsing.
    // However, usually it's on its own line.

    // Check if line is purely an email or phone
    if (PATTERNS.EMAIL.test(line) && line.split('@').length === 2 && line.length < 50) continue;

    // If line has < 5 words and is mostly letters, it's a strong candidate
    const words = line.split(/\s+/);
    if (words.length >= 1 && words.length <= 4) {
      // Clean noise
      const cleanLine = line.replace(/[^a-zA-Z\s.-]/g, '');
      if (cleanLine.length > 2) {
        return cleanLine.trim();
      }
    }
  }

  // Fallback: Just return the first line if it's reasonably short
  if (lines[0] && lines[0].length < 40) return lines[0].trim();

  return '';
}

/**
 * Extract contact information with high recall
 */
export function extractContact(text: string): {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
} {
  // 1. Email Extraction
  const emailMatch = text.match(PATTERNS.EMAIL);
  const email = emailMatch?.[0] || '';

  // 2. Phone Extraction
  const phoneMatcher = new RegExp(PATTERNS.PHONE, 'g');
  const possiblePhones = text.match(phoneMatcher) || [];
  let phone = '';

  for (const p of possiblePhones) {
    const digits = p.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      if (!p.match(/^\d{4}[-]\d{4}$/) && !p.match(/^\d{4}[-]\d{2}[-]\d{2}$/)) {
        phone = p.trim();
        break;
      }
    }
  }

  // 3. LinkedIn Extraction - Robust Multi-pass
  let linkedin = '';

  // Pass 1: Standard URL
  const linkedinMatch = text.match(PATTERNS.LINKEDIN);
  if (linkedinMatch) {
    linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Pass 2: Loose URL (e.g. linkedin.com/in/user without https)
  if (!linkedin) {
    const looseMatch = text.match(PATTERNS.LINKEDIN_LOOSE);
    if (looseMatch) {
      linkedin = `https://linkedin.com/in/${looseMatch[1]}`;
    }
  }

  // Pass 3: Text Label (e.g. "LinkedIn: username")
  if (!linkedin) {
    // Search in first 1000 chars to avoid false positives in body text
    const headerContext = text.substring(0, 1000);
    const textMatch = headerContext.match(PATTERNS.LINKEDIN_TEXT);
    if (textMatch) {
      // Validate username length and chars
      const possibleUser = textMatch[1].trim();
      if (possibleUser.length > 3 && possibleUser.length < 50) {
        linkedin = `https://linkedin.com/in/${possibleUser}`;
      }
    }
  }

  // 4. GitHub Extraction
  const githubMatch = text.match(PATTERNS.GITHUB);
  let github = '';
  if (githubMatch) {
    const username = githubMatch[1];
    github = `https://github.com/${username}`;
  }

  // 5. Website/Portfolio Extraction (exclude linkedin and github)
  let website = '';
  const urlMatches = text.match(new RegExp(PATTERNS.WEBSITE, 'gi')) || [];
  for (const url of urlMatches) {
    const lowerUrl = url.toLowerCase();
    // Skip linkedin and github
    if (lowerUrl.includes('linkedin.com') || lowerUrl.includes('github.com') ||
      lowerUrl.includes('gitlab.com') || lowerUrl.includes('gmail.com') ||
      lowerUrl.includes('outlook.com') || lowerUrl.includes('yahoo.com')) {
      continue;
    }
    // Must have a dot and reasonable length
    if (url.includes('.') && url.length > 5 && url.length < 100) {
      website = url.startsWith('http') ? url : `https://${url}`;
      break;
    }
  }

  // 6. Location Extraction
  const BLACKLIST_LOCATIONS = [
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
    'engineer', 'developer', 'manager', 'consultant', 'analyst', 'associate', 'resume', 'curriculum', 'vitae',
    'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests',
    'english', 'hindi', 'telugu', 'tamil', 'kannada', 'marathi', 'gujarati', 'urdu', 'punjabi', 'bengali', 'malayalam'
  ];

  const commonLocations = [
    'India', 'USA', 'United States', 'Remote', 'London', 'New York', 'California', 'Texas',
    'Bangalore', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Chennai', 'Gurgaon', 'Noida', 'Kolkata', 'Ahmedabad',
    'Toronto', 'Vancouver', 'Canada', 'Germany', 'Berlin', 'Munich', 'UK', 'Singapore', 'Dubai', 'UAE', 'Australia', 'Sydney', 'Melbourne'
  ];

  // Look at the first 1000 chars (Header Area)
  const headerText = text.substring(0, 1000);
  let location = '';

  // Strategy A: Split by common delimiters (|, •, newline) and check each part
  const tokens = headerText.split(/[\n|•]/);

  for (const token of tokens) {
    const cleanToken = token.trim();
    if (cleanToken.length < 2 || cleanToken.length > 50) continue;

    // Skip email/phone/url
    if (PATTERNS.EMAIL.test(cleanToken) || PATTERNS.PHONE.test(cleanToken) || PATTERNS.URL.test(cleanToken)) continue;

    const lowerToken = cleanToken.toLowerCase();

    // Check if it matches a known location
    const matchedLocation = commonLocations.find(loc => lowerToken.includes(loc.toLowerCase()));
    if (matchedLocation) {
      // Validate it's not a blacklist word
      if (!BLACKLIST_LOCATIONS.some(bad => lowerToken.includes(bad))) {
        location = cleanToken; // Take the full token (e.g. "Hyderabad, India")
        break;
      }
    }
  }

  return { email, phone, location, linkedin, github, website };
}

/**
 * Repair lines that look like "S U M M A R Y" -> "SUMMARY"
 */
function repairSpacedHeader(line: string): string {
  // Regex for lines that are uppercase letters separated by spaces
  // Example: "E X P E R I E N C E"
  if (/^([A-Z][\s]+){2,}[A-Z]$/.test(line.trim())) {
    const collapsed = line.replace(/\s+/g, '');
    if (collapsed.length > 3) return collapsed;
  }
  return line;
}

/**
 * Dedicated repair for Contact Info lines which are critical
 * e.g. "Ind ia  ba no th ... @ ..."
 */
function repairContactLine(line: string): string {
  let processed = line;

  // STRATEGY: Pre-emptively find "Hidden" locations in spaced text and force a separator
  // e.g. "I n d i a s a n..." -> "I n d i a | s a n..."
  // This prevents them from merging when we collapse spaces.
  const commonLocations = [
    'India', 'USA', 'United States', 'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Chennai',
    'London', 'New York', 'California', 'Texas', 'Remote', 'Toronto', 'Canada', 'Germany', 'UK'
  ];

  for (const loc of commonLocations) {
    // Create a regex that matches the location with optional spaces between letters
    // e.g. I\s*n\s*d\s*i\s*a
    const spacedRegexStr = loc.split('').join('\\s*');
    // We look for this pattern followed immediately by a letter (potential merge)
    // or just generally to isolate it.
    const spacedRegex = new RegExp(`(${spacedRegexStr})`, 'gi');

    if (spacedRegex.test(processed)) {
      // If found, we want to ensure it has a separator after it if it's followed by text
      // We replace it with "$1 | " (match + separator)
      // But we must be careful not to double-add separators
      // We essentially add a "barrier" of known safe separation.
      processed = processed.replace(spacedRegex, '$1 | ');
    }
  }

  // If it contains an @ or looks like a phone, we treat it aggressively
  if (processed.includes('@') || /\+\d/.test(processed)) {
    // Logic:
    // 1. Identification: Does it have many small tokens?
    const tokens = processed.trim().split(/\s+/);
    const smallTokens = tokens.filter(t => t.length <= 3).length;

    if (smallTokens / tokens.length > 0.4) {
      // This is a fragmented contact line. 

      let repaired = processed
        .replace(/\s{2,}/g, '{{SEP}}')
        .replace(/\|/g, '{{SEP}}')
        .replace(/•/g, '{{SEP}}') // Bullets
        .replace(/ /g, '')        // Collapse all single spaces
        .replace(/{{SEP}}/g, ' | '); // Restore separators

      return repaired;
    }
  }
  return line;
}

/**
 * Repair text that has been corrupted with spaced characters 
 */
function heuristicRepairSpacing(text: string): string {
  const lines = text.split('\n');
  const repairedLines: string[] = [];

  for (const line of lines) {
    if (line.trim().length === 0) {
      repairedLines.push(line);
      continue;
    }

    let processedLine = line;

    // 0. Critical: Check for Contact Line specifically
    const contactRepaired = repairContactLine(processedLine);
    if (contactRepaired !== processedLine) {
      repairedLines.push(contactRepaired);
      continue;
    }

    // 1. Specific Repair: Spaced Email
    if (processedLine.includes('@')) {
      const atIndex = processedLine.indexOf('@');
      const start = Math.max(0, atIndex - 50);
      const end = Math.min(processedLine.length, atIndex + 50);
      const context = processedLine.substring(start, end);
      if ((context.match(/ /g) || []).length > context.length / 3) {
        processedLine = processedLine.replace(/\s+@\s+/g, '@');
        processedLine = processedLine.replace(/\s+\.\s+/g, '.');
      }
    }

    // 2. Specific Repair: Spaced Phone
    if (/\+\s*\d/.test(processedLine)) {
      processedLine = processedLine.replace(/(\+)\s+(\d)/g, '$1$2');
    }

    // 3. General Repair
    const tokens = processedLine.trim().split(/\s+/);
    if (tokens.length < 2) {
      repairedLines.push(processedLine);
      continue;
    }

    // Calculate "fragment" density
    const fragmentTokens = tokens.filter(t => t.length <= 2 && /[a-zA-Z0-9]/.test(t)).length;
    const ratio = fragmentTokens / tokens.length;

    if (ratio > 0.5) {
      const hasDoubleSpaces = /\s{2,}/.test(processedLine);

      if (hasDoubleSpaces) {
        // Robust: We have clear delimiters. Safe to collapse single spaces.
        let repaired = processedLine
          .replace(/\s{2,}/g, '{{SPACE}}')
          .replace(/ /g, '')
          .replace(/{{SPACE}}/g, ' ');
        repairedLines.push(repaired);
      } else {
        // SAFE MODE:
        // If NO double spaces, we are very risky.
        // merging "worked on java" -> "workedonjava" is BAD.
        // It's better to report "w o r k e d   o n   j a v a" and let AI figure it out.

        // UNLESS it looks like a Header (All Caps)
        const isAllCaps = processedLine === processedLine.toUpperCase();

        if (isAllCaps) {
          let repaired = processedLine.replace(/ /g, '');
          repairedLines.push(repaired);
        } else {
          // DO NOT COLLAPSE body text without double-space safety.
          repairedLines.push(processedLine);
        }
      }
    } else {
      repairedLines.push(processedLine);
    }
  }

  return repairedLines.join('\n');
}

/**
 * Identify section boundaries
 */
function identifySections(text: string) {
  const lines = text.split('\n');
  const sections: { [key: string]: string[] } = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    other: []
  };

  let currentSection = 'other';

  // Regex for section headers
  const headers = {
    summary: /^(professional\s+)?(summary|profile|objective|overview|about\s+me)/i,
    experience: /^(professional\s+)?(experience|work\s+history|employment|career\s+history|work\s+experience)/i,
    education: /^(education|academic|qualifications|coursework)/i,
    skills: /^(technical\s+)?(skills|competencies|technologies|tech\s+stack|core\s+competencies)/i,
    certifications: /^(certifications|licenses|awards|honors|achievements)/i,
    projects: /^(projects|portfolio|personal\s+projects)/i,
    other: /^(references|languages|interests)/i
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Attempt to repair spaced headers
    // e.g. "E X P E R I E N C E" -> "EXPERIENCE"
    const repairedLine = repairSpacedHeader(line);

    // Check if line is a header
    let isHeader = false;
    for (const [key, regex] of Object.entries(headers)) {
      // Header heuristic: mostly uppercase or short & ends with colon or strictly matches regex
      const cleanLine = repairedLine.replace(/[:]/g, '');
      if (regex.test(cleanLine) && cleanLine.length < 40) {
        currentSection = key === 'other' ? 'other' : key; // Reset or switch
        isHeader = true;
        // If we repaired the line, use the repaired version for clarity, 
        // though we usually just use it to switch sections. 
        // We probably don't need to add the header line itself to the section content.
        break;
      }
    }

    if (!isHeader) {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

/**
 * Extract professional summary
 */
function extractProfessionalSummary(lines: string[]): string {
  return lines.join(' ').trim();
}

/**
 * Extract experience
 */
function extractExperience(lines: string[]): Experience[] {
  const experiences: Experience[] = [];
  let currentExp: Partial<Experience> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Heuristic for new job entry:
    // 1. Line contains a date range
    // 2. Line is short and capitalized (Title/Company)

    // Check for date range
    const dateRangeMatch = line.match(PATTERNS.DATE_RANGE);
    if (dateRangeMatch) {
      // Save previous
      if (currentExp && (currentExp.title || currentExp.company)) {
        experiences.push(currentExp as Experience);
      }
      currentExp = { description: [] };

      currentExp.duration = dateRangeMatch[0];

      // Try to extract title/company from the same line or previous line
      const textWithoutDate = line.replace(PATTERNS.DATE_RANGE, '').trim();
      if (textWithoutDate.length > 3) {
        // Either Company or Title
        // Assume the first significant part is Company/Title
        if (textWithoutDate.includes('|') || textWithoutDate.includes('-')) {
          const parts = textWithoutDate.split(/[|-]/);
          currentExp.title = parts[0].trim();
          currentExp.company = parts[1]?.trim() || '';
        } else {
          currentExp.company = textWithoutDate; // Fallback
        }
      } else if (i > 0) {
        // Look at previous line
        const prevLine = lines[i - 1].trim();
        currentExp.title = prevLine;
      }
    } else if (currentExp.description) {
      // It's part of the description or title/company if missing
      if (!currentExp.title && line.length < 50 && !line.startsWith('-')) {
        currentExp.title = line;
      } else if (!currentExp.company && line.length < 50 && !line.startsWith('-')) {
        currentExp.company = line;
      } else {
        currentExp.description.push(line.replace(/^[-•*]\s*/, ''));
      }
    }
  }

  if (currentExp && (currentExp.title || currentExp.company)) {
    experiences.push(currentExp as Experience);
  }

  // Deduplicate and clean experiences
  const uniqueExperiences: Experience[] = [];
  const seen = new Set<string>();

  // Helper to clean fragmented text (e.g., "a l  d e v" -> "al dev")
  const cleanFragmentedText = (text: string | undefined): string => {
    if (!text) return "";

    // Check if text has suspicious spacing (many single chars separated by spaces)
    const tokens = text.trim().split(/\s+/);
    const singleCharCount = tokens.filter(t => t.length === 1).length;

    if (singleCharCount > tokens.length * 0.4 && tokens.length > 3) {
      // This looks fragmented, try to collapse
      // First, preserve double spaces as word boundaries
      let cleaned = text
        .replace(/\s{2,}/g, '{{SPACE}}')
        .replace(/ /g, '')
        .replace(/{{SPACE}}/g, ' ')
        .trim();
      return cleaned;
    }

    return text.trim();
  };

  for (const exp of experiences) {
    // Clean up fragmented text in title and company
    if (exp.title) {
      exp.title = cleanFragmentedText(exp.title);
    }
    if (exp.company) {
      exp.company = cleanFragmentedText(exp.company);
    }

    // Create a unique key for each experience
    const key = `${exp.title?.toLowerCase()}|${exp.company?.toLowerCase()}|${exp.duration?.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueExperiences.push(exp);
    }
  }

  return uniqueExperiences;
}

/**
 * Extract education
 */
function extractEducation(lines: string[]): Education[] {
  const items: Education[] = [];
  let current: Partial<Education> = {};

  for (const line of lines) {
    if (line.match(/(bachelor|master|phd|diploma|associate|degree|comput|science|engineer|arts|business)/i)) {
      if (current.degree || current.institution) items.push(current as Education);
      current = { details: [] };
      current.degree = line;
    } else if (line.match(/(university|college|school|institute)/i)) {
      if (!current.institution) current.institution = line;
      else if (current.details) current.details.push(line);
    } else if (line.match(/\d{4}/)) {
      current.graduation_date = line.match(/\d{4}/)?.[0];
    } else {
      if (current.details) current.details.push(line);
      else current.details = [line];
    }
  }
  if (current.degree || current.institution) items.push(current as Education);
  return items;
}

/**
 * Extract skills
 */
function extractSkills(lines: string[]): string[] {
  // Common delimiters
  const text = lines.join('\n');
  // messy OCR might turn " | " into " i " or " l "
  const candidates = text.split(/[,;\n•|]|\s{2,}|\s[iIl]\s/);
  return candidates
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40) // Reasonable skill length
    .filter(s => !s.match(/^(skills|technologies)$/i));
}

/**
 * Extract projects - reusing simple logic, but acting on specific section lines
 */
function extractProjects(lines: string[]): Project[] {
  const projects: Project[] = [];
  let current: Partial<Project> = {};

  for (const line of lines) {
    // Heuristic: Bold or short line is title
    if (line.length < 40 && !line.startsWith('-')) {
      if (current.name) projects.push(current as Project);
      current = { name: line, description: '', technologies: [] };
    } else {
      if (current.name) {
        if (line.toLowerCase().includes('technologies') || line.toLowerCase().includes('stack')) {
          current.technologies = line.split(/[:,]/).slice(1).map(s => s.trim());
        } else {
          current.description += (current.description ? ' ' : '') + line;
        }
      }
    }
  }
  if (current.name) projects.push(current as Project);
  return projects;
}


/**
 * Normalize raw resume text into structured format
 */
export async function normalizeResume(rawText: string): Promise<NormalizedResume> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Resume text is empty');
  }

  // Basic cleanup
  let cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[^\x20-\x7E\n\t]/g, ''); // Remove non-printable, keep newlines

  // Attempt to repair globally spaced text (e.g. "S U M M A R Y" -> "SUMMARY")
  cleanedText = heuristicRepairSpacing(cleanedText);

  // Identif sections
  const sections = identifySections(cleanedText);

  const name = extractName(cleanedText);
  const { email, phone, location, linkedin, github, website } = extractContact(cleanedText);

  const experience = extractExperience(sections.experience);
  const education = extractEducation(sections.education);
  const skills = extractSkills(sections.skills);
  const professional_summary = extractProfessionalSummary(sections.summary);
  const certifications = sections.certifications; // Clean lines as string array
  const projects = extractProjects(sections.projects);

  // Collect unclassified content to ensure nothing is lost
  const unclassified_content = sections.other.join('\n');

  return {
    name,
    email,
    phone,
    location,
    linkedin,
    github,
    website,
    professional_summary,
    experience: experience as Experience[], // Type assertion due to Partial
    education: education as Education[],
    skills,
    certifications,
    projects: projects as Project[],
    raw_text: rawText,
    unclassified_content
  };
}

/**
 * Format normalized resume as clean markdown
 */
export function formatNormalizedResume(resume: NormalizedResume): string {
  let output = '';

  // Header with contact info
  if (resume.name) output += `# ${resume.name}\n\n`;

  const contact: string[] = [];
  if (resume.email) contact.push(resume.email);
  if (resume.phone) contact.push(resume.phone);
  if (resume.location) contact.push(resume.location);
  if (resume.linkedin) contact.push(resume.linkedin);
  if (resume.github) contact.push(resume.github);
  if (resume.website) contact.push(resume.website);

  if (contact.length > 0) {
    output += `${contact.join(' | ')}\n\n`;
  }

  // Professional Summary
  if (resume.professional_summary) {
    output += `## Professional Summary\n${resume.professional_summary}\n\n`;
  }

  // Experience
  if (resume.experience.length > 0) {
    output += `## Professional Experience\n\n`;
    for (const exp of resume.experience) {
      if (!exp.title && !exp.company) continue;
      output += `**${exp.title || 'Role'}** | ${exp.company || 'Company'}\n`;
      if (exp.duration) {
        output += `${exp.duration}\n`;
      }
      if (exp.location) output += `${exp.location}\n`;

      if (exp.description && exp.description.length > 0) {
        for (const desc of exp.description) {
          output += `- ${desc}\n`;
        }
      }
      output += '\n';
    }
  }

  // Education
  if (resume.education.length > 0) {
    output += `## Education\n\n`;
    for (const edu of resume.education) {
      output += `**${edu.degree || 'Degree'}** | ${edu.institution || 'Institution'}\n`;
      if (edu.graduation_date) output += `Graduated: ${edu.graduation_date}\n`;
      if (edu.gpa) output += `GPA: ${edu.gpa}\n`;
      if (edu.details?.length) {
        for (const detail of edu.details) {
          output += `- ${detail}\n`;
        }
      }
      output += '\n';
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    output += `## Skills\n${resume.skills.join(', ')}\n\n`;
  }

  // Certifications
  if (resume.certifications.length > 0) {
    output += `## Certifications\n`;
    for (const cert of resume.certifications) {
      output += `- ${cert}\n`;
    }
    output += '\n';
  }

  // Projects
  if (resume.projects.length > 0) {
    output += `## Projects\n\n`;
    for (const project of resume.projects) {
      output += `**${project.name}**\n${project.description}\n`;
      if (project.technologies.length > 0) {
        output += `**Technologies:** ${project.technologies.join(', ')}\n`;
      }
      output += '\n';
    }
  }

  // Unclassified / Other content - appended at the end for the AI to see
  if (resume.unclassified_content && resume.unclassified_content.length > 20) {
    output += `## Other Information\n${resume.unclassified_content}\n\n`;
  }

  return output.trim();
}
