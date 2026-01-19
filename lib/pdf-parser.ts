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

    // Suppress verbose warnings (Type3 fonts, etc.) - they're just informational
    // We'll only log actual errors
    const originalConsoleWarn = console.warn;
    const suppressedWarnings = new Set<string>();
    console.warn = (...args: any[]) => {
      const message = args.join(" ");
      // Suppress Type3 font warnings and other pdf2json internal warnings
      if (
        message.includes("Type3 font") ||
        message.includes("fake worker") ||
        message.includes("Unsupported:") ||
        message.includes("NOT valid form")
      ) {
        // Suppress these warnings - they're expected for many PDFs
        return;
      }
      // Log other warnings
      originalConsoleWarn.apply(console, args);
    };

    return new Promise<ParsedResume>((resolve, reject) => {
      let parsedText = "";
      let pageCount = 0;
      const metadata: any = {};

      // Set up event handlers
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        // Restore console.warn before error handling
        console.warn = originalConsoleWarn;

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

          // Extract text from ALL pages with error handling per page
          let pagesWithText = 0;
          const maxPages = 100; // Increased limit to capture complete resumes

          const pagesToProcess = (pdfData.Pages || []).slice(0, maxPages);

          console.log(`Processing ${pagesToProcess.length} pages from PDF`);

          for (let i = 0; i < pagesToProcess.length; i++) {
            try {
              const page = pagesToProcess[i];
              if (!page) continue;

              const pageText = extractTextFromPage(page);
              const trimmedText = pageText.trim();

              if (trimmedText.length > 0) {
                parsedText += trimmedText + "\n\n";
                pagesWithText++;
              }
            } catch (pageError: any) {
              console.error(`Error processing page ${i + 1}:`, pageError.message);
              // Continue with other pages - don't fail completely
              // If it's the first page and it fails, we might have a problem
              if (i === 0 && pagesWithText === 0) {
                throw new Error(`Failed to extract text from first page: ${pageError.message}`);
              }
            }
          }

          // Log page processing results
          if (pagesToProcess.length > 0) {
            console.log(`Successfully extracted text from ${pagesWithText}/${pagesToProcess.length} pages`);
          }

          // Warn if pages were skipped (but don't limit to 50 anymore)
          if ((pdfData.Pages || []).length > maxPages) {
            console.warn(`PDF has ${pdfData.Pages.length} pages, processing first ${maxPages} pages`);
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

          // Restore console.warn
          console.warn = originalConsoleWarn;

          // Clean and normalize text
          const cleanedText = cleanResumeText(text);

          // Scan for hidden LinkedIn links in the raw buffer
          const hiddenLinks = scanBufferForLinks(pdfBuffer);
          let finalText = cleanedText;

          if (hiddenLinks.length > 0) {
            console.log(`Found ${hiddenLinks.length} hidden LinkedIn links in raw buffer`);
            const uniqueLinks = [...new Set(hiddenLinks)];
            finalText += "\n\n[DETECTED METADATA]\n" + uniqueLinks.join("\n");
          }

          resolve({
            text: finalText,
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
        // Restore console.warn on error
        console.warn = originalConsoleWarn;
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
 * Scans the raw PDF buffer for LinkedIn URLs that might be hidden in annotations/streams
 * This is a "brute force" method to catch links that text identifiers miss
 */
function scanBufferForLinks(buffer: Buffer): string[] {
  try {
    // Convert buffer to latin1 string to preserve binary sequences while keeping ASCII readable
    const rawData = buffer.toString('latin1');

    // Regex for LinkedIn URLs (loose pattern)
    // Matches: linkedin.com/in/username
    // We intentionally avoid lookbehinds to likely matching across binary garbage
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-%]+)/gi;

    const matches = rawData.match(linkedinRegex) || [];

    // Clean up matches
    return matches.map(match => {
      // Normalize to https
      let clean = match.replace(/[\x00-\x1F\x7F-\x9F]/g, ""); // Remove non-printable chars
      if (!clean.startsWith('http')) {
        clean = 'https://' + clean;
      }
      return clean;
    });
  } catch (e) {
    console.warn("Buffer scan failed:", e);
    return [];
  }
}

/**
 * Extract text from a PDF page object with comprehensive handling
 */
function extractTextFromPage(page: any): string {
  if (!page || !page.Texts || !Array.isArray(page.Texts)) {
    return "";
  }

  const positionedItems: Array<{ x: number; y: number; text: string }> = [];

  try {
    for (const textObj of page.Texts) {
      if (!textObj) continue;

      const x = typeof textObj.x === "number" ? textObj.x : 0;
      const y = typeof textObj.y === "number" ? textObj.y : 0;

      const pieces: string[] = [];

      // Handle different text object structures
      if (textObj.R && Array.isArray(textObj.R)) {
        // Standard structure: R array with T properties
        for (const run of textObj.R) {
          if (run && run.T) {
            try {
              // Try to decode URI-encoded text only if it looks encoded
              let text = run.T;
              if (text && text.includes("%")) {
                try {
                  text = decodeURIComponent(text);
                } catch (e) {
                  // If decoding fails, use original
                }
              }
              if (text.trim().length > 0) {
                pieces.push(text);
              }
            } catch (e) {
              if (run.T && run.T.trim().length > 0) {
                pieces.push(run.T);
              }
            }
          }
        }
      } else if (textObj.T) {
        // Direct text property
        try {
          let text = textObj.T;
          if (text && text.includes("%")) {
            try {
              text = decodeURIComponent(text);
            } catch (e) {
              // If decoding fails, use original
            }
          }
          if (text.trim().length > 0) {
            pieces.push(text);
          }
        } catch (e) {
          if (textObj.T && textObj.T.trim().length > 0) {
            pieces.push(textObj.T);
          }
        }
      } else if (typeof textObj === "string") {
        // Simple string
        if (textObj.trim().length > 0) {
          pieces.push(textObj);
        }
      }

      const combined = pieces.join("").replace(/\s+/g, " ").trim();
      if (combined.length > 0) {
        positionedItems.push({ x, y, text: combined });
      }
    }
  } catch (extractError) {
    console.error("Error extracting text from page:", extractError);
    // Return what we have so far
  }

  if (positionedItems.length === 0) return "";

  // Group by approximate line (y position)
  const lineMap = new Map<number, Array<{ x: number; text: string }>>();
  const quantizeY = (val: number) => Math.round(val * 2) / 2; // 0.5 precision

  for (const item of positionedItems) {
    const yKey = quantizeY(item.y);
    const arr = lineMap.get(yKey) ?? [];
    arr.push({ x: item.x, text: item.text });
    lineMap.set(yKey, arr);
  }

  const yKeys = Array.from(lineMap.keys()).sort((a, b) => a - b);
  const lines: string[] = [];

  for (const yKey of yKeys) {
    const items = (lineMap.get(yKey) ?? []).sort((a, b) => a.x - b.x);
    let line = "";
    let prevEndX: number | null = null;
    let prevToken = "";

    for (const item of items) {
      const token = item.text.replace(/\s+/g, " ").trim();
      if (!token) continue;

      if (!line) {
        line = token;
        prevToken = token;
        prevEndX = item.x + token.length * 0.5;
        continue;
      }

      const gap = prevEndX !== null ? item.x - prevEndX : 0;
      const prevLast = line.slice(-1);
      const curFirst = token[0];

      const prevIsSingle = prevToken.length === 1 && /^[A-Za-z0-9]$/.test(prevToken);
      const curIsSingle = token.length === 1 && /^[A-Za-z0-9]$/.test(token);
      const joinAsWord = prevIsSingle && curIsSingle && gap < 1.2;

      const needsSpace =
        !joinAsWord &&
        (gap > 1.8 || (/[-\w)]$/.test(prevLast) && /^[\w(]/.test(curFirst)));

      line += (needsSpace ? " " : "") + (joinAsWord ? token : token);
      prevToken = token;
      prevEndX = item.x + token.length * 0.5;
    }

    if (line.trim().length > 0) {
      lines.push(line.trim());
    }
  }

  return lines.join("\n");
}

/**
 * Clean and normalize resume text with better garbage detection
 */
function cleanResumeText(text: string): string {
  let cleaned = text
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
    .join("\n");

  // Detect if text is mostly garbage (repeating single characters like G, B, F, etc.)
  // If more than 40% of non-whitespace characters are the same repeated character, it's likely corrupted
  const lines = cleaned.split("\n");
  const validLines: string[] = [];

  for (const line of lines) {
    // Check if line is mostly garbage (single repeated character)
    const charCount: Record<string, number> = {};
    let maxCount = 0;
    let maxChar = "";

    for (const char of line) {
      if (char.match(/[A-Za-z0-9]/)) {
        charCount[char] = (charCount[char] || 0) + 1;
        if (charCount[char] > maxCount) {
          maxCount = charCount[char];
          maxChar = char;
        }
      }
    }

    const totalChars = Object.values(charCount).reduce((a, b) => a + b, 0);
    const repetitionRatio = totalChars > 0 ? maxCount / totalChars : 0;

    // If a single character makes up more than 60% of the line, it's garbage
    if (repetitionRatio < 0.6 || line.length < 3) {
      validLines.push(line);
    }
  }

  cleaned = validLines.join("\n");

  // Final trim
  return cleaned.trim();
}

/**
 * Extract key information from resume text with improved name detection
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

  // Extract name with advanced detection
  let name: string | undefined;

  // Strategy 1: Look for lines that don't match common patterns
  const commonSectionHeaders = [
    "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "CERTIFICATIONS",
    "SUMMARY", "OBJECTIVE", "TECHNICAL", "PROFESSIONAL", "SUMMARY",
    "LANGUAGES", "AWARDS", "PUBLICATIONS", "CONTACT", "LINKS"
  ];

  for (const line of lines.slice(0, 8)) {
    // Skip section headers, emails, and phone numbers
    const lineUpper = line.toUpperCase();
    if (
      line.match(emailRegex) ||
      line.match(phoneRegex) ||
      commonSectionHeaders.some(h => lineUpper.includes(h)) ||
      line.length < 2 ||
      line.length > 80 ||
      line.match(/^[^a-zA-Z\s]/i) // Starts with non-letter/space
    ) {
      continue;
    }

    // Check if line looks like a name (has at least 2 words or is a proper noun pattern)
    const namePattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$|^[A-Z][a-z]+$|^[A-Z]\.?\s*[A-Z][a-z]+/;
    if (line.match(namePattern)) {
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
