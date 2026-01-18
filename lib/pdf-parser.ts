import { PDFParse } from "pdf-parse";

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

    // Parse PDF
    const pdfParse = require("pdf-parse");
    const pdfData = await pdfParse(pdfBuffer, {
      max: 0, // Parse all pages
    });

    // Validate parsed content
    if (!pdfData || !pdfData.text) {
      throw new Error("Failed to extract text from PDF. The PDF might be image-based or corrupted.");
    }

    const text = pdfData.text.trim();

    // Check if text was extracted
    if (text.length < 50) {
      throw new Error("PDF appears to be image-based or contains very little text. Please use a text-based PDF.");
    }

    // Clean and normalize text
    const cleanedText = cleanResumeText(text);

    return {
      text: cleanedText,
      pages: pdfData.numpages || 1,
      metadata: {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
      },
    };
  } catch (error: any) {
    // Enhanced error messages
    if (error.message.includes("Invalid PDF")) {
      throw new Error("Invalid PDF file. Please ensure the file is a valid PDF document.");
    }
    if (error.message.includes("password")) {
      throw new Error("PDF is password-protected. Please remove the password and try again.");
    }
    if (error.message.includes("corrupted")) {
      throw new Error("PDF file appears to be corrupted. Please try a different file.");
    }
    
    throw new Error(`PDF parsing failed: ${error.message}`);
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
