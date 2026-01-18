/**
 * Placeholder and Template Detection
 * Removes common placeholder text from generated resume/cover letters
 */

// Common placeholders and template markers
const PLACEHOLDER_PATTERNS = [
  // Hiring manager and company info
  /\[hiring manager(?:'s)? name\]/gi,
  /\[company name\]/gi,
  /\[company\]/gi,
  /\[job title\]/gi,
  /\[candidate name\]/gi,
  /\[your name\]/gi,
  /\[position\]/gi,
  /\[department\]/gi,
  /hiring manager/gi,
  /hiring team/gi,
  /dear (?:hiring|recruitment) (?:manager|team)/gi,
  
  // Date placeholders
  /\[date\]/gi,
  /\[today(?:'s)? date\]/gi,
  /\[current date\]/gi,
  
  // Generic greetings and salutations
  /^to (?:whom it may concern|the hiring (?:manager|team))[:]?$/gim,
  /^dear [^:]*[:]?$/gim,
  
  // Lorem ipsum and filler text
  /lorem ipsum/gi,
  /(?:this is a template|this is an example|sample text)/gi,
  
  // Common placeholder lines
  /^(?:sincerely|best regards|regards|thank you)[,.]?$/gim,
  /^[a-z\s]*\[placeholder\]/gim,
  
  // Bracketed placeholders in general
  /\[[^\]]*(?:name|title|company|date|address|phone|email|position|role|department|manager|team|info|details?|insert|fill|replace|your|my|the)[^\]]*\]/gi,
];

// Lines that indicate template/example sections
const TEMPLATE_MARKERS = [
  /example of a (?:cover letter|resume)/gi,
  /this is (?:a|an) example/gi,
  /template(?::|:$)/gi,
  /note:|reminder:|remember:/gi,
  /^---+$/gm,
  /^===+$/gm,
  /^\*\*\*.*\*\*\*$/gm,
];

// Patterns that indicate unfinished/template sections
const UNFINISHED_PATTERNS = [
  /\.\.\./g,
  /\[to be completed\]/gi,
  /\[fill in\]/gi,
  /insert.*here/gi,
  /^pending$/gim,
  /^tbd$/gim,
  /^placeholder$/gim,
  /write about/gi,
  /describe your/gi,
];

/**
 * Detect if text is likely a placeholder or template content
 */
export function isPlaceholder(line: string): boolean {
  if (!line || line.trim().length === 0) return false;
  
  const trimmed = line.trim();
  
  // Check against all patterns
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  // Check for template markers
  for (const pattern of TEMPLATE_MARKERS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  // Check for unfinished content
  for (const pattern of UNFINISHED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Remove placeholders and clean content
 */
export function removeAllPlaceholders(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove all placeholder patterns
  for (const pattern of PLACEHOLDER_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // Remove lines that are just placeholders/templates
  cleaned = cleaned
    .split("\n")
    .filter(line => !isPlaceholder(line))
    .join("\n");
  
  // Clean up excessive whitespace
  cleaned = cleaned
    .replace(/\n{4,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n");
  
  return cleaned.trim();
}

/**
 * Detect if content appears to be a template/example
 */
export function isTemplateContent(text: string): boolean {
  if (!text || text.length === 0) return true;
  
  // Count placeholder-like content
  let placeholderCount = 0;
  
  for (const pattern of PLACEHOLDER_PATTERNS.concat(TEMPLATE_MARKERS)) {
    const matches = text.match(pattern) || [];
    placeholderCount += matches.length;
  }
  
  // If more than 10% of the text is placeholders/markers, it's likely a template
  const placeholderWords = placeholderCount * 3; // Rough estimate
  const totalWords = text.split(/\s+/).length;
  
  return placeholderWords / totalWords > 0.1 || placeholderCount > 5;
}

/**
 * Sanitize cover letter by removing common placeholder patterns
 */
export function sanitizeCoverLetter(text: string, candidateName?: string): string {
  if (!text) return text;
  
  let cleaned = removeAllPlaceholders(text);
  
  // Remove empty lines at the start and end
  cleaned = cleaned
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n");
  
  // Remove duplicate content blocks
  cleaned = removeDuplicateParagraphs(cleaned);
  
  return cleaned.trim();
}

/**
 * Remove near-duplicate paragraphs (common in templates)
 */
function removeDuplicateParagraphs(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const para of paragraphs) {
    const normalized = para
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
    
    // Only add if not seen before and is substantial
    if (normalized.length > 20 && !seen.has(normalized)) {
      seen.add(normalized);
      unique.push(para.trim());
    }
  }
  
  return unique.join("\n\n");
}

/**
 * Filter out generic/low-value sentences
 */
export function filterGenericContent(text: string): string {
  if (!text) return text;
  
  const genericPhrases = [
    /^[Tt]hank you for (?:your time|considering|your consideration)/gim,
    /^I (?:am|'m) excited about/gim,
    /^I believe my (?:skills|experience|qualifications) would/gim,
    /^I look forward to/gim,
    /^Sincerely,?$/gim,
    /^Best regards,?$/gim,
    /^Warm regards,?$/gim,
    /^Respectfully,?$/gim,
  ];
  
  let filtered = text;
  
  for (const pattern of genericPhrases) {
    filtered = filtered.replace(pattern, "");
  }
  
  // Clean up resulting whitespace
  filtered = filtered
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  
  return filtered.trim();
}
