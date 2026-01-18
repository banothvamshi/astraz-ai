/**
 * Simple Reliable PDF Parser
 * Focuses on reading the ENTIRE PDF without failing
 */

export interface PDFParseResult {
  text: string;
  pages: number;
  success: boolean;
  error?: string;
  debug?: {
    rawPages: string[];
    totalChars: number;
    averagePageLength: number;
  };
}

/**
 * Lazy load pdf-parse to avoid build issues
 */
async function getPdfParser() {
  return require('pdf-parse');
}

/**
 * Parse PDF using pdf-parse library
 * This is the most reliable method for reading PDFs
 */
export async function parseWithPdfParse(buffer: Buffer): Promise<PDFParseResult> {
  try {
    const pdf = await getPdfParser();
    
    console.log(`[PDF Parser] Starting pdf-parse with buffer size: ${buffer.length} bytes`);
    
    const data = await pdf(buffer);
    
    console.log(`[PDF Parser] Successfully parsed PDF with ${data.numpages} pages`);
    
    if (!data.text || data.text.trim().length === 0) {
      console.warn('[PDF Parser] Warning: PDF extracted but text is empty');
      return {
        text: '',
        pages: data.numpages,
        success: false,
        error: 'PDF has no text content',
      };
    }
    
    console.log(`[PDF Parser] Extracted ${data.text.length} characters from PDF`);
    
    // Split by pages to debug
    const pageTexts = data.text.split(/\n---\n|Page \d+/);
    
    return {
      text: data.text,
      pages: data.numpages,
      success: true,
      debug: {
        rawPages: pageTexts.slice(0, 3), // First 3 pages for debugging
        totalChars: data.text.length,
        averagePageLength: Math.round(data.text.length / data.numpages),
      },
    };
  } catch (error: any) {
    console.error('[PDF Parser] pdf-parse failed:', error.message);
    throw error;
  }
}

/**
 * Parse PDF using pdfjs-dist with better error handling
 */
export async function parseWithPDFJS(buffer: Buffer): Promise<PDFParseResult> {
  try {
    console.log('[PDF Parser] Trying pdfjs-dist fallback');
    
    const pdfjs = await import('pdfjs-dist');
    
    (pdfjs as any).GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await (pdfjs as any).getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, 100);
    
    console.log(`[PDF Parser] PDFJS found ${pageCount} pages`);
    
    const texts: string[] = [];
    
    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          texts.push(pageText);
        }
      } catch (pageError) {
        console.warn(`[PDF Parser] Failed to read page ${i}: ${(pageError as any).message}`);
      }
    }
    
    const fullText = texts.join('\n');
    
    if (!fullText.trim()) {
      console.warn('[PDF Parser] PDFJS extracted no text');
      return {
        text: '',
        pages: pageCount,
        success: false,
        error: 'PDFJS extracted no text',
      };
    }
    
    console.log(`[PDF Parser] PDFJS extracted ${fullText.length} characters`);
    
    return {
      text: fullText,
      pages: pageCount,
      success: true,
    };
  } catch (error: any) {
    console.error('[PDF Parser] PDFJS failed:', error.message);
    throw error;
  }
}

/**
 * Parse PDF using OCR as last resort
 */
export async function parseWithOCR(buffer: Buffer): Promise<PDFParseResult> {
  try {
    console.log('[PDF Parser] Trying OCR fallback (tesseract)');
    
    const Tesseract = await import('tesseract.js');
    
    // First convert PDF to images (basic approach)
    console.log('[PDF Parser] OCR fallback - this may take time for multi-page PDFs');
    
    // For now, return error as OCR requires additional setup
    throw new Error('OCR requires canvas - try pdf-parse first');
  } catch (error: any) {
    console.error('[PDF Parser] OCR failed:', error.message);
    throw error;
  }
}

/**
 * Main PDF parser with retry logic
 */
export async function parsePDFReliable(buffer: Buffer): Promise<string> {
  console.log('\n========== STARTING PDF PARSE ==========');
  console.log(`Buffer size: ${buffer.length} bytes`);
  console.log(`Buffer starts with: ${buffer.toString('utf8', 0, 50)}`);
  console.log(`First 4 bytes (should be %PDF): ${buffer.slice(0, 4).toString()}`);
  
  const strategies = [
    {
      name: 'pdf-parse',
      fn: () => parseWithPdfParse(buffer),
      minConfidence: 0.8,
    },
    {
      name: 'pdfjs-dist',
      fn: () => parseWithPDFJS(buffer),
      minConfidence: 0.7,
    },
  ];
  
  let lastError: Error | null = null;
  
  for (const strategy of strategies) {
    try {
      console.log(`\n[PDF Parser] Attempting strategy: ${strategy.name}`);
      const result = await strategy.fn();
      
      if (result.success && result.text.trim().length > 0) {
        console.log(`[PDF Parser] ✅ SUCCESS with ${strategy.name}`);
        console.log(`[PDF Parser] Extracted ${result.text.length} characters from ${result.pages} pages`);
        console.log('========== PDF PARSE COMPLETE ==========\n');
        return result.text;
      } else {
        console.log(`[PDF Parser] ⚠️ ${strategy.name} returned empty text`);
        lastError = new Error(`${strategy.name} returned no text`);
      }
    } catch (error: any) {
      console.error(`[PDF Parser] ❌ ${strategy.name} failed: ${error.message}`);
      lastError = error;
      // Continue to next strategy
    }
  }
  
  // All strategies failed
  console.error('[PDF Parser] All parsing strategies failed!');
  console.log('========== PDF PARSE FAILED ==========\n');
  throw lastError || new Error('Failed to parse PDF with all available strategies');
}

/**
 * Detect if buffer is a valid PDF
 */
export function isPDFBuffer(buffer: Buffer): boolean {
  // Check PDF magic bytes: %PDF
  return buffer.length > 4 && buffer.slice(0, 4).toString() === '%PDF';
}

/**
 * Extract metadata from PDF
 */
export async function getPDFMetadata(buffer: Buffer): Promise<any> {
  try {
    const pdf = await getPdfParser();
    const data = await pdf(buffer, { max: 0 }); // Don't parse text, just metadata
    return {
      pages: data.numpages,
      title: data.info?.Title || 'Unknown',
      author: data.info?.Author || 'Unknown',
      created: data.info?.CreationDate || 'Unknown',
    };
  } catch (error) {
    return { pages: 0, error: (error as any).message };
  }
}
