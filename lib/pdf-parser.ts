export interface ParsedResume {
  text: string;
  pages: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Premium PDF parsing with comprehensive error handling
 * Uses dynamic import to avoid browser API issues in Node.js
 */
export async function parseResumePDF(pdfBuffer: Buffer): Promise<ParsedResume> {
  try {
    // Validate buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Invalid PDF buffer: buffer is empty");
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (pdfBuffer.length > maxSize) {
      throw new Error(`PDF file too large: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
    }

    // Use pdf-parse with proper error handling
    // Load pdf-parse dynamically to avoid initialization issues
    let pdfParse: any;
    
    try {
      // Try CommonJS require first (more reliable for server-side)
      pdfParse = require("pdf-parse");
    } catch (requireError: any) {
      // If require fails, try ES module import
      try {
        const pdfParseModule = await import("pdf-parse");
        pdfParse = pdfParseModule.default || pdfParseModule;
      } catch (importError: any) {
        throw new Error(`Failed to load PDF parser: ${importError.message}`);
      }
    }
    
    // Ensure pdfParse is a function
    if (typeof pdfParse !== "function") {
      throw new Error("PDF parser is not a function. Please check pdf-parse installation.");
    }
    
    // Parse PDF - pass buffer directly (not file path)
    // This prevents pdf-parse from trying to access test files
    const pdfData = await pdfParse(pdfBuffer, {
      max: 0, // Parse all pages (0 = all pages)
    });

    // Validate parsed content
    const text = (pdfData.text || "").trim();

    if (!text || text.length === 0) {
      throw new Error("Failed to extract text from PDF. The PDF might be image-based or corrupted.");
    }

    // Check if text was extracted
    if (text.length < 50) {
      throw new Error("PDF appears to be image-based or contains very little text. Please use a text-based PDF.");
    }

    // Clean and normalize text
    const cleanedText = cleanResumeText(text);

    return {
      text: cleanedText,
      pages: pdfData.numpages || pdfData.pages?.length || 1,
      metadata: {
        title: pdfData.info?.Title || pdfData.metadata?.title,
        author: pdfData.info?.Author || pdfData.metadata?.author,
        subject: pdfData.info?.Subject || pdfData.metadata?.subject,
      },
    };
  } catch (error: any) {
    // Enhanced error messages
    const errorMsg = error.message || String(error);
    
    // Handle test file access errors (pdf-parse initialization issue)
    if (errorMsg.includes("test/data") || errorMsg.includes("ENOENT")) {
      // This is a pdf-parse internal error, retry with different approach
      console.error("PDF parser initialization error, retrying...", errorMsg);
      try {
        // Retry with a fresh require
        const pdfParseRetry = require("pdf-parse");
        const pdfDataRetry = await pdfParseRetry(pdfBuffer, { max: 0 });
        const textRetry = (pdfDataRetry.text || "").trim();
        
        if (textRetry && textRetry.length >= 50) {
          return {
            text: cleanResumeText(textRetry),
            pages: pdfDataRetry.numpages || 1,
            metadata: {
              title: pdfDataRetry.info?.Title,
              author: pdfDataRetry.info?.Author,
              subject: pdfDataRetry.info?.Subject,
            },
          };
        }
      } catch (retryError: any) {
        throw new Error("Failed to parse PDF. Please ensure it's a valid, text-based PDF file.");
      }
    }
    
    if (errorMsg.includes("Invalid PDF")) {
      throw new Error("Invalid PDF file. Please ensure the file is a valid PDF document.");
    }
    if (errorMsg.includes("password")) {
      throw new Error("PDF is password-protected. Please remove the password and try again.");
    }
    if (errorMsg.includes("corrupted")) {
      throw new Error("PDF file appears to be corrupted. Please try a different file.");
    }
    
    throw new Error(`PDF parsing failed: ${errorMsg}`);
  }
}

/**
 * Clean and normalize resume text
 */
function cleanResumeText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Remove special characters that might interfere
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize line breaks
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, "\n\n")
    // Trim
    .trim();
}

/**
 * Extract key information from resume text
 */
export function extractResumeSections(text: string): {
  name?: string;
  email?: string;
  phone?: string;
  sections: Record<string, string>;
} {
  const sections: Record<string, string> = {};
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  // Extract contact info
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}/g;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];

  // Extract name (usually first line)
  let name: string | undefined;
  if (lines.length > 0 && !lines[0].match(emailRegex) && !lines[0].match(phoneRegex)) {
    name = lines[0];
  }

  // Extract sections (common resume sections)
  const sectionHeaders = [
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "EDUCATION",
    "SKILLS",
    "TECHNICAL SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "AWARDS",
    "PUBLICATIONS",
    "LANGUAGES",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "OBJECTIVE",
  ];

  let currentSection = "HEADER";
  let currentContent: string[] = [];

  for (const line of lines) {
    const upperLine = line.toUpperCase();
    const isSectionHeader = sectionHeaders.some((header) => upperLine.includes(header));

    if (isSectionHeader) {
      if (currentSection !== "HEADER" && currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n");
      }
      currentSection = line.toUpperCase();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Add last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n");
  }

  return {
    name,
    email: emails[0],
    phone: phones[0],
    sections,
  };
}
