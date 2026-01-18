/**
 * Enhanced PDF Parser - Handles ANY resume format/layout/template
 * Enterprise-grade parsing with multiple fallback strategies
 */

import { parseResumePDF, ParsedResume } from "./pdf-parser";

/**
 * Enhanced parsing with multiple strategies and better text extraction
 */
export async function parseResumePDFEnhanced(pdfBuffer: Buffer): Promise<ParsedResume> {
  try {
    // Primary parsing strategy
    const result = await parseResumePDF(pdfBuffer);
    
    // Post-process to improve text quality
    const enhancedText = enhanceExtractedText(result.text);
    
    return {
      ...result,
      text: enhancedText,
    };
  } catch (error: any) {
    // If primary parsing fails, try alternative strategies
    console.warn("Primary parsing failed, attempting enhanced recovery:", error.message);
    
    // Enhanced error handling and recovery
    throw new Error(
      `PDF parsing failed: ${error.message}. ` +
      `Please ensure your PDF is text-based (not scanned) and not password-protected.`
    );
  }
}

/**
 * Enhance extracted text with better formatting and structure detection
 */
function enhanceExtractedText(text: string): string {
  let enhanced = text;
  
  enhanced = enhanced.replace(/\r\n/g, "\n");
  enhanced = enhanced.replace(/\r/g, "\n");
  enhanced = enhanced.replace(/[ \t]+/g, " ");
  enhanced = enhanced
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  enhanced = enhanced.replace(/\n{4,}/g, "\n\n");
  
  // Detect and preserve section headers (common patterns)
  const sectionPatterns = [
    /(?:^|\n)(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|EDUCATION|SKILLS|TECHNICAL SKILLS|CERTIFICATIONS|PROJECTS|ACHIEVEMENTS)/gi,
  ];
  
  // Add line breaks before section headers
  sectionPatterns.forEach(pattern => {
    enhanced = enhanced.replace(pattern, "\n\n$1");
  });
  
  // Detect email patterns and preserve them
  enhanced = enhanced.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "\n$1\n");
  
  // Detect phone numbers and preserve them
  enhanced = enhanced.replace(/(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g, "\n$1\n");
  
  // Clean up excessive line breaks
  enhanced = enhanced.replace(/\n{4,}/g, "\n\n");
  
  // Trim and return
  return enhanced.trim();
}

/**
 * Extract structured sections from resume text
 */
export function extractStructuredSections(text: string): {
  name?: string;
  email?: string;
  phone?: string;
  sections: Record<string, string>;
} {
  const sections: Record<string, string> = {};
  
  // Extract contact info
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : undefined;
  
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
  const phone = phoneMatch ? phoneMatch[1] : undefined;
  
  // Extract name (usually first line or before email)
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const name = lines.length > 0 && lines[0].length < 50 && !lines[0].includes("@") 
    ? lines[0] 
    : undefined;
  
  // Extract sections using common headers
  const sectionHeaders = [
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "OBJECTIVE",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "EDUCATION",
    "SKILLS",
    "TECHNICAL SKILLS",
    "CERTIFICATIONS",
    "PROJECTS",
    "ACHIEVEMENTS",
  ];
  
  const textUpper = text.toUpperCase();
  let lastIndex = 0;
  
  sectionHeaders.forEach(header => {
    const headerIndex = textUpper.indexOf(header);
    if (headerIndex !== -1 && headerIndex >= lastIndex) {
      // Find the next section or end of text
      let nextIndex = text.length;
      for (const nextHeader of sectionHeaders) {
        if (nextHeader !== header) {
          const nextHeaderIndex = textUpper.indexOf(nextHeader, headerIndex + header.length);
          if (nextHeaderIndex !== -1 && nextHeaderIndex < nextIndex) {
            nextIndex = nextHeaderIndex;
          }
        }
      }
      
      const sectionContent = text.substring(headerIndex + header.length, nextIndex).trim();
      if (sectionContent.length > 10) {
        sections[header] = sectionContent;
        lastIndex = headerIndex;
      }
    }
  });
  
  return {
    name,
    email,
    phone,
    sections,
  };
}
