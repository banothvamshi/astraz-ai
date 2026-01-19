import { ParsedResume } from "./pdf-parser";

/**
 * Advanced Universal Document Parser v2
 * Handles mixed content PDFs, scanned pages, DOCX, images with multi-page OCR
 * Gracefully handles edge cases, corruption, and special characters
 */

interface ParseStrategy {
  name: string;
  canHandle: (buffer: Buffer) => boolean;
  parse: (buffer: Buffer, options: ParseOptions) => Promise<string>;
}

interface ParseOptions {
  includeOCR?: boolean;
  ocrLanguage?: string;
  maxPages?: number;
  mergePages?: boolean;
}

interface ParseResult {
  text: string;
  format: string;
  pages: number;
  strategy: string;
  hasErrors: boolean;
  confidence?: number;
}

// ============================================================================
// STRATEGY 1: Text-Based PDF Parser
// ============================================================================

async function parseTextPDFStrategy(buffer: Buffer): Promise<string> {
  try {
    const { parseResumePDF } = await import("./pdf-parser");
    const result = await parseResumePDF(buffer);
    return result.text;
  } catch (error: any) {
    console.log("Text PDF parsing failed:", error.message);
    throw error;
  }
}

// ============================================================================
// STRATEGY 2: Multi-Page PDF with Smart Page Extraction
// ============================================================================

async function parseMultiPagePDF(buffer: Buffer, options: ParseOptions): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist");

    // Set worker for Node.js
    (pdfjs as any).GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const maxPages = options.maxPages || 50;
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, maxPages);

    console.log(`Processing PDF with ${pageCount} pages...`);

    const pageTexts: string[] = [];
    let successfulPages = 0;
    let failedPages = 0;

    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Extract text items
        const items = (textContent as any).items || [];
        let pageText = "";

        // Group items by Y position (approximate line detection)
        const itemsByLine: Map<number, any[]> = new Map();

        for (const item of items) {
          if (item.str && item.str.trim()) {
            const yPos = Math.round(item.y);
            if (!itemsByLine.has(yPos)) {
              itemsByLine.set(yPos, []);
            }
            itemsByLine.get(yPos)!.push(item);
          }
        }

        // Sort lines by Y position and build text
        const sortedYPositions = Array.from(itemsByLine.keys()).sort((a, b) => b - a);
        for (const yPos of sortedYPositions) {
          const lineItems = itemsByLine.get(yPos)!;
          // Sort items in line by X position
          lineItems.sort((a, b) => a.x - b.x);
          const lineText = lineItems.map((item) => item.str).join(" ");
          pageText += lineText + "\n";
        }

        pageText = pageText.trim();

        // Only add if page has meaningful text
        if (pageText.length > 20) {
          pageTexts.push(pageText);
          successfulPages++;
        }
      } catch (pageError: any) {
        console.warn(`Page ${pageNum} extraction failed:`, pageError.message);
        failedPages++;
        // Continue to next page instead of failing
      }
    }

    if (pageTexts.length === 0) {
      throw new Error(`Failed to extract text from any of ${pageCount} pages`);
    }

    console.log(`Successfully extracted ${successfulPages} pages (${failedPages} failed)`);

    // Join all pages with separator
    return pageTexts.join("\n\n--- PAGE BREAK ---\n\n");
  } catch (error: any) {
    throw new Error(`Multi-page PDF parsing failed: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 3: OCR with Multi-Page Support and Mixed Content
// ============================================================================

async function parseWithOCRStrategy(
  buffer: Buffer,
  options: ParseOptions
): Promise<string> {
  try {
    const Tesseract = await import("tesseract.js");
    const language = options.ocrLanguage || "eng";
    const maxPages = options.maxPages || 20;

    const isPdf = buffer.slice(0, 4).toString() === "%PDF";

    let imageBuffers: Buffer[] = [];

    if (isPdf) {
      console.log("Extracting images from PDF for OCR...");
      imageBuffers = await extractPDFPagesToImages(buffer, maxPages);
    } else {
      imageBuffers = [buffer];
    }

    if (imageBuffers.length === 0) {
      throw new Error("No images to process");
    }

    console.log(`Processing ${imageBuffers.length} pages with OCR...`);

    const ocrResults: string[] = [];
    const { createWorker } = Tesseract;
    const worker = await createWorker(language);

    for (let i = 0; i < imageBuffers.length; i++) {
      try {
        const imageBuffer = imageBuffers[i];
        const imageBase64 = imageBuffer.toString("base64");
        const imageData = `data:image/png;base64,${imageBase64}`;

        console.log(`OCR processing page ${i + 1}/${imageBuffers.length}...`);

        const { data } = await worker.recognize(imageData);

        if (data.text && data.text.trim().length > 0) {
          ocrResults.push(data.text);
          console.log(`Page ${i + 1} OCR confidence: ${(data.confidence || 0).toFixed(2)}%`);
        }
      } catch (pageError: any) {
        console.warn(`OCR failed for page ${i + 1}:`, pageError.message);
        // Continue with next page
      }
    }

    await worker.terminate();

    if (ocrResults.length === 0) {
      throw new Error("OCR failed to extract text from any page");
    }

    console.log(`Successfully extracted text from ${ocrResults.length} pages via OCR`);

    return ocrResults.join("\n\n--- PAGE BREAK ---\n\n");
  } catch (error: any) {
    throw new Error(`OCR parsing failed: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 4: Hybrid Text + OCR for Mixed Content PDFs
// ============================================================================

async function parseHybridPDF(
  buffer: Buffer,
  options: ParseOptions
): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist");
    (pdfjs as any).GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const maxPages = options.maxPages || 50;
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, maxPages);

    console.log(`Hybrid parsing PDF with ${pageCount} pages...`);

    const pageTexts: string[] = [];
    const Tesseract = await import("tesseract.js");
    const { createWorker } = Tesseract;
    const worker = await createWorker(options.ocrLanguage || "eng");

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        let pageText = "";
        let useOCR = false;

        try {
          // First try to extract text
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const items = (textContent as any).items || [];

          // Extract and organize text
          const itemsByLine: Map<number, any[]> = new Map();
          let totalTextLength = 0;

          for (const item of items) {
            if (item.str && item.str.trim()) {
              const yPos = Math.round(item.y);
              if (!itemsByLine.has(yPos)) {
                itemsByLine.set(yPos, []);
              }
              itemsByLine.get(yPos)!.push(item);
              totalTextLength += item.str.length;
            }
          }

          // If we got meaningful text, use it
          if (totalTextLength > 50) {
            const sortedYPositions = Array.from(itemsByLine.keys()).sort((a, b) => b - a);
            for (const yPos of sortedYPositions) {
              const lineItems = itemsByLine.get(yPos)!;
              lineItems.sort((a, b) => a.x - b.x);
              const lineText = lineItems.map((item) => item.str).join(" ");
              pageText += lineText + "\n";
            }
            pageText = pageText.trim();
          } else {
            // Not enough text, fall back to OCR
            console.log(`Page ${pageNum}: insufficient text (${totalTextLength} chars), using OCR`);
            useOCR = true;
          }
        } catch (textError: any) {
          console.log(`Page ${pageNum}: text extraction failed, falling back to OCR`);
          useOCR = true;
        }

        // Use OCR if needed
        if (useOCR && options.includeOCR) {
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });

            // Render page to canvas (requires canvas library)
            const imageBuffer = await renderPDFPageToBuffer(page, viewport);

            if (imageBuffer) {
              const imageBase64 = imageBuffer.toString("base64");
              const imageData = `data:image/png;base64,${imageBase64}`;

              const { data } = await worker.recognize(imageData);

              if (data.text && data.text.trim().length > 0) {
                pageText = data.text;
                console.log(`Page ${pageNum}: OCR extracted ${data.text.length} characters`);
              }
            }
          } catch (ocrError: any) {
            console.warn(`Page ${pageNum} OCR failed:`, ocrError.message);
          }
        }

        if (pageText && pageText.length > 20) {
          pageTexts.push(pageText);
        }
      } catch (pageError: any) {
        console.warn(`Page ${pageNum} processing failed:`, pageError.message);
        continue;
      }
    }

    await worker.terminate();

    if (pageTexts.length === 0) {
      throw new Error("Hybrid parsing failed to extract text from any page");
    }

    console.log(`Hybrid parsing completed: ${pageTexts.length} pages extracted`);

    return pageTexts.join("\n\n--- PAGE BREAK ---\n\n");
  } catch (error: any) {
    throw new Error(`Hybrid PDF parsing failed: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 5: DOCX Parser
// ============================================================================

async function parseDocxStrategy(buffer: Buffer): Promise<string> {
  try {
    const AdmZip = require("adm-zip");
    const zip = new AdmZip(buffer);

    const docXmlEntry = zip.getEntry("word/document.xml");
    if (!docXmlEntry) {
      throw new Error("Not a valid DOCX file");
    }

    const docXml = docXmlEntry.getData().toString("utf8");

    // Extract all text elements
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const texts: string[] = [];
    let match;

    while ((match = textRegex.exec(docXml)) !== null) {
      if (match[1]) {
        texts.push(match[1]);
      }
    }

    if (texts.length === 0) {
      throw new Error("No text found in DOCX");
    }

    return texts.join(" ");
  } catch (error: any) {
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function extractPDFPagesToImages(
  buffer: Buffer,
  maxPages: number
): Promise<Buffer[]> {
  try {
    const pdfjs = await import("pdfjs-dist");
    (pdfjs as any).GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, maxPages);
    const imageBuffers: Buffer[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const imageBuffer = await renderPDFPageToBuffer(page, viewport);

        if (imageBuffer) {
          imageBuffers.push(imageBuffer);
        }
      } catch (error: any) {
        console.warn(`Failed to extract page ${pageNum} as image:`, error.message);
      }
    }

    return imageBuffers;
  } catch (error: any) {
    throw new Error(`PDF to image extraction failed: ${error.message}`);
  }
}

async function renderPDFPageToBuffer(page: any, viewport: any): Promise<Buffer | null> {
  try {
    // Dynamically require canvas to avoid build issues if it's missing in some environments
    const { createCanvas } = require("canvas");

    // Create canvas of the size of the viewport
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    // Render PDF page to canvas context
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to buffer
    return canvas.toBuffer("image/png");
  } catch (error: any) {
    console.warn("PDF page rendering failed:", error.message);
    // If canvas fails, we might still want to try other methods or just return null
    return null;
  }
}

// ============================================================================
// STRATEGY 6: PDF2JSON Parser (node-only, robust)
// ============================================================================

async function parsePdf2JsonStrategy(buffer: Buffer): Promise<string> {
  try {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser(null, 1); // 1 = text content only

    return new Promise((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(errData.parserError));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });
  } catch (error: any) {
    throw new Error(`pdf2json parsing failed: ${error.message}`);
  }
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

/**
 * Main universal parser - tries multiple strategies with fallbacks
 */
export async function parseUniversalDocument(
  buffer: Buffer,
  customOptions: ParseOptions = {}
): Promise<ParsedResume> {
  const options: ParseOptions = {
    includeOCR: true,
    ocrLanguage: "eng",
    maxPages: 50,
    mergePages: true,
    ...customOptions,
  };

  console.log("=== Universal Document Parser Started ===");
  console.log(`Buffer size: ${buffer.length} bytes`);

  // Detect format
  const format = detectFormat(buffer);
  console.log(`Detected format: ${format}`);

  let extractedText = "";
  let parseStrategy = "unknown";
  let hasErrors = false;

  try {
    switch (format) {
      case "pdf": {
        // Try multiple PDF parsing strategies
        const strategies = [
          { name: "Text-based PDF", fn: () => parseTextPDFStrategy(buffer) },
          { name: "PDF2JSON", fn: () => parsePdf2JsonStrategy(buffer) },
          { name: "Multi-page PDF", fn: () => parseMultiPagePDF(buffer, options) },
          { name: "Hybrid (Text + OCR)", fn: () => parseHybridPDF(buffer, options) },
          { name: "Pure OCR", fn: () => parseWithOCRStrategy(buffer, options) },
        ];

        for (const strategy of strategies) {
          try {
            console.log(`Trying strategy: ${strategy.name}`);
            extractedText = await strategy.fn();

            if (extractedText && extractedText.trim().length > 150) {
              parseStrategy = strategy.name;
              console.log(`✓ Success with ${strategy.name}`);
              break;
            }
          } catch (error: any) {
            console.log(`✗ Failed with ${strategy.name}: ${error.message}`);
            hasErrors = true;
            // Continue to next strategy
          }
        }

        if (!extractedText || extractedText.trim().length < 150) {
          throw new Error("All PDF parsing strategies failed to extract meaningful text");
        }
        break;
      }

      case "docx":
        console.log("Parsing DOCX file...");
        extractedText = await parseDocxStrategy(buffer);
        parseStrategy = "DOCX";
        break;

      case "image":
        console.log("Parsing image with OCR...");
        extractedText = await parseWithOCRStrategy(buffer, options);
        parseStrategy = "Image OCR";
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Clean and normalize extracted text
    extractedText = cleanExtractedText(extractedText);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No readable text could be extracted from the document");
    }

    console.log(`=== Parsing Complete ===`);
    console.log(`Strategy: ${parseStrategy}, Text length: ${extractedText.length} chars`);

    return {
      text: extractedText,
      pages: Math.ceil(extractedText.length / 3000),
      metadata: {
        title: format,
        author: parseStrategy,
        subject: format,
      },
    };
  } catch (error: any) {
    console.error("Document parsing error:", error.message);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function detectFormat(buffer: Buffer): string {
  if (buffer.slice(0, 4).toString() === "%PDF") return "pdf";
  if (buffer.slice(0, 2).toString("hex") === "504b") return "docx";
  if (buffer.slice(0, 8).toString("hex") === "89504e470d0a1a0a") return "image";
  if (buffer.slice(0, 2).toString("hex") === "ffd8") return "image";
  if (
    buffer.slice(0, 6).toString("ascii") === "GIF87a" ||
    buffer.slice(0, 6).toString("ascii") === "GIF89a"
  )
    return "image";
  return "unknown";
}

function cleanExtractedText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove excessive whitespace while preserving structure
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n");

  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Fix common OCR issues
  cleaned = fixOCRIssues(cleaned);

  return cleaned.trim();
}

function fixOCRIssues(text: string): string {
  // Fix common OCR character substitutions
  const replacements: [RegExp, string][] = [
    // I (capital i) vs l (lowercase L) at word boundaries
    [/\bl(?=\s|,|\.)/gi, "i"],
    // O (capital o) vs 0 (zero) in common contexts
    [/\bO(?=\d)/g, "0"],
    // Common character swap: rn -> m
    [/rn(?=\s|[aeiou])/g, "m"],
  ];

  let cleaned = text;
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  return cleaned;
}
