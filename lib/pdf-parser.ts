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
 * Uses pdf2json - a pure Node.js PDF parser (no browser dependencies)
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

    // Validate PDF header
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    if (!pdfHeader.startsWith("%PDF")) {
      throw new Error("Invalid PDF file. File does not start with PDF header.");
    }

    // Use pdf2json - pure Node.js, no browser dependencies
    const PDFParser = (await import("pdf2json")).default;
    const pdfParser = new PDFParser();

    return new Promise<ParsedResume>((resolve, reject) => {
      let parsedText = "";
      let pageCount = 0;
      const metadata: any = {};

      // Set up event handlers
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        const errorMsg = errData.parserError || "Unknown PDF parsing error";
        if (errorMsg.includes("password") || errorMsg.includes("encrypted")) {
          reject(new Error("PDF is password-protected. Please remove the password and try again."));
        } else if (errorMsg.includes("corrupted") || errorMsg.includes("invalid")) {
          reject(new Error("PDF file appears to be corrupted or invalid. Please try a different file."));
        } else {
          reject(new Error(`PDF parsing failed: ${errorMsg}`));
        }
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          pageCount = pdfData.Pages?.length || 0;

          if (pageCount === 0) {
            reject(new Error("PDF has no pages. The file may be corrupted."));
            return;
          }

          // Extract metadata
          if (pdfData.Meta) {
            metadata.title = pdfData.Meta.Title;
            metadata.author = pdfData.Meta.Author;
            metadata.subject = pdfData.Meta.Subject;
          }

          // Extract text from all pages
          let pagesWithText = 0;
          for (const page of pdfData.Pages || []) {
            const pageText = extractTextFromPage(page);
            if (pageText.trim().length > 0) {
              parsedText += pageText + "\n\n";
              pagesWithText++;
            }
          }

          // Validate extracted text
          const text = parsedText.trim();

          if (!text || text.length === 0) {
            reject(new Error("Failed to extract text from PDF. The PDF might be image-based (scanned) or contain no text. Please use a text-based PDF."));
            return;
          }

          if (text.length < 50) {
            reject(new Error(`PDF appears to be image-based or contains very little text (only ${text.length} characters extracted). Please use a text-based PDF or convert scanned PDFs to text first.`));
            return;
          }

          if (pagesWithText === 0) {
            reject(new Error("No text could be extracted from any page. The PDF might be image-based or corrupted."));
            return;
          }

          // Clean and normalize text
          const cleanedText = cleanResumeText(text);

          resolve({
            text: cleanedText,
            pages: pageCount,
            metadata: {
              title: metadata.title,
              author: metadata.author,
              subject: metadata.subject,
            },
          });
        } catch (parseError: any) {
          reject(new Error(`Failed to process parsed PDF data: ${parseError.message}`));
        }
      });

      // Parse the PDF buffer
      try {
        pdfParser.parseBuffer(pdfBuffer);
      } catch (parseError: any) {
        reject(new Error(`Failed to parse PDF: ${parseError.message}`));
      }
    });
  } catch (error: any) {
    // Enhanced error messages
    const errorMsg = error.message || String(error);
    
    // Don't wrap our own formatted errors
    if (errorMsg.startsWith("Invalid PDF") || 
        errorMsg.startsWith("PDF is password-protected") ||
        errorMsg.startsWith("Failed to extract text") ||
        errorMsg.startsWith("PDF appears to be image-based") ||
        errorMsg.startsWith("No text could be extracted") ||
        errorMsg.startsWith("PDF has no pages") ||
        errorMsg.startsWith("PDF file too large")) {
      throw error;
    }
    
    // Handle specific error types
    if (errorMsg.includes("password") || errorMsg.includes("encrypted")) {
      throw new Error("PDF is password-protected. Please remove the password and try again.");
    }
    
    if (errorMsg.includes("Invalid PDF") || errorMsg.includes("invalid")) {
      throw new Error("Invalid PDF file. Please ensure it's a valid PDF document.");
    }
    
    if (errorMsg.includes("corrupted")) {
      throw new Error("PDF file appears to be corrupted. Please try a different file.");
    }
    
    // Generic error with helpful message
    throw new Error(`PDF parsing failed: ${errorMsg}. Please ensure you're uploading a valid, text-based PDF file.`);
  }
}

/**
 * Extract text from a PDF page object
 */
function extractTextFromPage(page: any): string {
  if (!page.Texts || !Array.isArray(page.Texts)) {
    return "";
  }

  const textItems: string[] = [];
  
  for (const textObj of page.Texts) {
    if (textObj.R && Array.isArray(textObj.R)) {
      for (const run of textObj.R) {
        if (run.T) {
          // Decode URI-encoded text
          try {
            const decodedText = decodeURIComponent(run.T);
            textItems.push(decodedText);
          } catch (e) {
            // If decoding fails, use as-is
            textItems.push(run.T);
          }
        }
      }
    }
  }

  return textItems.join(" ");
}

/**
 * Clean and normalize resume text
 */
function cleanResumeText(text: string): string {
  return text
    // Remove excessive whitespace (but keep single spaces)
    .replace(/[ \t]+/g, " ")
    // Remove special control characters that might interfere
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize line breaks
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove multiple consecutive newlines (keep max 2)
    .replace(/\n{3,}/g, "\n\n")
    // Remove leading/trailing whitespace from each line
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    // Final trim
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

  // Extract name (usually first line that's not email/phone)
  let name: string | undefined;
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    if (!line.match(emailRegex) && !line.match(phoneRegex) && line.length > 2 && line.length < 50) {
      name = line;
      break;
    }
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
