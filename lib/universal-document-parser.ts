import { ParsedResume } from "./pdf-parser";

/**
 * Universal Document Parser
 * Handles PDF (text & scanned), DOCX, and image formats with OCR fallback
 * Automatically detects format and uses the best parsing strategy
 */

interface DocumentParseOptions {
  includeOCR?: boolean;
  ocrLanguage?: string;
  timeout?: number;
}

interface DocumentParseResult {
  text: string;
  format: "pdf-text" | "pdf-scanned" | "docx" | "image" | "mixed";
  pages: number;
  metadata?: Record<string, any>;
  confidence?: number; // OCR confidence score if applicable
}

/**
 * Detect document type from buffer
 */
function detectDocumentType(
  buffer: Buffer
): "pdf" | "docx" | "image" | "unknown" {
  // Check for PDF header
  if (buffer.slice(0, 4).toString() === "%PDF") {
    return "pdf";
  }

  // Check for DOCX header (ZIP file containing specific files)
  if (
    buffer.slice(0, 2).toString("hex") === "504b" &&
    buffer.includes(Buffer.from("[Content_Types].xml"))
  ) {
    return "docx";
  }

  // Check for common image formats
  const header = buffer.slice(0, 12);

  // PNG
  if (header.slice(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return "image";
  }

  // JPEG
  if (header.slice(0, 2).toString("hex") === "ffd8") {
    return "image";
  }

  // GIF
  if (
    header.slice(0, 6).toString("ascii") === "GIF87a" ||
    header.slice(0, 6).toString("ascii") === "GIF89a"
  ) {
    return "image";
  }

  // WEBP
  if (
    header.slice(0, 4).toString("ascii") === "RIFF" &&
    header.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image";
  }

  return "unknown";
}

/**
 * Parse DOCX files
 */
async function parseDocxFile(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    // For now, extract text by parsing the XML structure
    // DOCX files are ZIP archives with XML content
    const AdmZip = require("adm-zip");
    const zip = new AdmZip(buffer);
    
    // Get document.xml which contains the main text
    const docXmlEntry = zip.getEntry("word/document.xml");
    if (!docXmlEntry) {
      throw new Error("Not a valid DOCX file - missing document.xml");
    }
    
    const docXml = docXmlEntry.getData().toString("utf8");
    
    // Extract text from XML (simple regex approach)
    // Proper way: parse XML and extract text nodes
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const texts: string[] = [];
    let match;
    
    while ((match = textRegex.exec(docXml)) !== null) {
      if (match[1].trim()) {
        texts.push(match[1]);
      }
    }
    
    const text = texts.join(" ");
    
    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in DOCX file");
    }
    
    return {
      text,
      format: "docx",
      pages: Math.ceil(text.length / 3000), // Estimate pages
      metadata: {
        source: "docx",
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to parse DOCX file: ${error.message}`);
  }
}

/**
 * Parse scanned PDF or image with OCR (simplified for Node.js)
 */
async function parseWithOCR(
  buffer: Buffer,
  language: string = "eng"
): Promise<DocumentParseResult> {
  try {
    const Tesseract = await import("tesseract.js");
    
    console.log("Starting OCR processing with Tesseract...");
    
    // For images, convert buffer to base64
    // For PDFs, we'll need to convert pages to images
    let imageData: string;
    
    const isPdf = buffer.slice(0, 4).toString() === "%PDF";
    
    if (isPdf) {
      // For PDFs, try to extract first page as image
      // This is a simplified approach - in production, you'd want full PDF->image conversion
      console.log("PDF detected - attempting to extract page as image for OCR");
      // For now, log a message - full implementation would need pdf-to-image conversion
      throw new Error("PDF OCR requires additional setup. Use text-based PDFs when possible.");
    } else {
      // For images, convert to base64
      imageData = `data:image/${getImageType(buffer)};base64,${buffer.toString("base64")}`;
    }
    
    // Create Tesseract worker
    const { createWorker } = Tesseract;
    const worker = await createWorker(language);
    
    console.log(`Recognizing text with language: ${language}`);
    const { data } = await worker.recognize(imageData);
    
    await worker.terminate();
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("OCR failed to extract any text from the image");
    }
    
    console.log(`OCR completed. Confidence: ${data.confidence?.toFixed(2)}%`);
    
    return {
      text: data.text.trim(),
      format: isPdf ? "pdf-scanned" : "image",
      pages: 1,
      confidence: data.confidence,
      metadata: {
        ocrLanguage: language,
      },
    };
  } catch (error: any) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Detect image type from buffer header
 */
function getImageType(buffer: Buffer): string {
  const header = buffer.slice(0, 12);
  
  if (header.slice(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return "png";
  }
  if (header.slice(0, 2).toString("hex") === "ffd8") {
    return "jpeg";
  }
  if (header.slice(0, 6).toString("ascii") === "GIF87a" || header.slice(0, 6).toString("ascii") === "GIF89a") {
    return "gif";
  }
  if (header.slice(0, 4).toString("ascii") === "RIFF" && header.slice(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  
  return "png"; // Default fallback
}

/**
 * Parse text-based PDF (existing method)
 */
async function parseTextPDF(buffer: Buffer): Promise<DocumentParseResult> {
  const { parseResumePDF } = await import("./pdf-parser");
  const result = await parseResumePDF(buffer);
  
  return {
    text: result.text,
    format: "pdf-text",
    pages: result.pages,
    metadata: result.metadata,
  };
}

/**
 * Intelligently detect if PDF is text-based or scanned
 */
async function isPDFTextBased(buffer: Buffer): Promise<boolean> {
  try {
    const pdfjs = await import("pdfjs-dist");
    
    if (typeof window === "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjs as any).version}/pdf.worker.min.js`;
    }
    
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // If we can extract text items, it's text-based
    const textItems = (textContent as any).items.filter((item: any) => item.str && item.str.trim().length > 0);
    const hasText = textItems.length > 10; // At least 10 text items
    
    const totalChars = textItems.reduce((sum: number, item: any) => sum + (item.str ? item.str.length : 0), 0);
    
    return hasText && totalChars > 50; // Meaningful amount of text
  } catch (error: any) {
    console.warn("Failed to detect PDF type:", error.message);
    return false; // Assume scanned if we can't determine
  }
}

/**
 * Main universal parser function
 */
export async function parseUniversalDocument(
  buffer: Buffer,
  options: DocumentParseOptions = {}
): Promise<ParsedResume> {
  const { includeOCR = true, ocrLanguage = "eng" } = options;
  
  // Detect document type
  const docType = detectDocumentType(buffer);
  
  console.log(`Detected document type: ${docType}`);
  
  let parseResult: DocumentParseResult;
  
  try {
    switch (docType) {
      case "docx":
        console.log("Parsing DOCX file...");
        parseResult = await parseDocxFile(buffer);
        break;
        
      case "pdf": {
        console.log("Analyzing PDF format (text-based vs scanned)...");
        // Try to detect if it's text-based
        try {
          const isTextBased = await isPDFTextBased(buffer);
          
          if (isTextBased) {
            console.log("PDF detected as text-based, using standard parser");
            parseResult = await parseTextPDF(buffer);
          } else {
            console.log("PDF detected as scanned/image-based");
            if (!includeOCR) {
              throw new Error("This PDF appears to be scanned. OCR is required but disabled.");
            }
            console.log("Extracting text with OCR...");
            parseResult = await parseWithOCR(buffer, ocrLanguage);
          }
        } catch (error: any) {
          // Fallback: try text parsing first
          console.log("Attempting fallback text parsing...");
          try {
            parseResult = await parseTextPDF(buffer);
          } catch (textError: any) {
            // If text parsing fails, try OCR
            console.warn("Text parsing failed, attempting OCR:", textError.message);
            if (!includeOCR) {
              throw new Error("Could not parse PDF. Please ensure it's a valid text-based PDF or enable OCR.");
            }
            parseResult = await parseWithOCR(buffer, ocrLanguage);
          }
        }
        break;
      }
        
      case "image":
        if (!includeOCR) {
          throw new Error("Image file detected. OCR is required to process images.");
        }
        console.log("Image detected, processing with OCR...");
        parseResult = await parseWithOCR(buffer, ocrLanguage);
        break;
        
      default:
        throw new Error("Unsupported document format. Supported formats: PDF (text or scanned), DOCX, images (PNG, JPG, GIF, WEBP).");
    }
    
    // Validate extracted text
    if (!parseResult.text || parseResult.text.trim().length === 0) {
      throw new Error("No text could be extracted from the document. Please ensure the file contains readable content.");
    }
    
    console.log(`Successfully parsed document: ${parseResult.format}, ${parseResult.pages} pages, ${parseResult.text.length} characters`);
    
    return {
      text: parseResult.text,
      pages: parseResult.pages,
      metadata: {
        title: parseResult.metadata?.source,
        author: undefined,
        subject: parseResult.format,
      },
    };
  } catch (error: any) {
    throw new Error(`Document parsing failed: ${error.message}`);
  }
}

/**
 * Convert legacy ParsedResume to universal result
 */
export async function parseDocumentLegacy(buffer: Buffer): Promise<ParsedResume> {
  return parseUniversalDocument(buffer, {
    includeOCR: true,
    ocrLanguage: "eng",
  });
}
