import { generateMultimodal } from "./gemini";
import { convertPdfToImages } from "./pdf-image-converter";
import { performOCR } from "./ocr-processor";
const pdf = require("pdf-parse");

export interface ParsedResume {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    links: string[];
    professional_summary: string;
    experience: {
        title: string;
        company: string;
        location: string;
        duration: string;
        description: string[];
    }[];
    education: {
        degree: string;
        institution: string;
        location: string;
        graduation_date: string;
        details: string[];
    }[];
    skills: {
        category: string;
        items: string[];
    }[];
    certifications: {
        name: string;
        issuer: string;
        date: string;
    }[];
    languages: string[];
}

/**
 * SUPER PARSER: The ultimate resume extraction pipeline.
 * Combines:
 * 1. Raw Text Extraction (pdf-parse)
 * 2. Visual Rendering (pdfjs-dist + canvas)
 * 3. OCR (tesseract.js)
 * 4. Multi-modal AI Synthesis (Gemini 2.0 Flash)
 */
export async function superParseResume(fileBuffer: Buffer): Promise<{ parsed: ParsedResume; ocrText: string; images: string[] }> {
    console.log("🚀 Starting Super Parser Pipeline...");
    const startTime = Date.now();

    try {
        // 0. Detect File Type (PDF vs Image)
        const isPdf = fileBuffer.lastIndexOf("%PDF-") === 0 || fileBuffer.indexOf("%PDF-") === 0;

        let rawText = "";
        let images: string[] = [];

        if (isPdf) {
            console.log("📄 Detected PDF format. Running full pipeline...");
            // 1. Parallel Execution of Extraction Layers
            const [rawTextResult, pdfImages] = await Promise.all([
                pdf(fileBuffer).catch((e: any) => ({ text: "" })), // Layer 1: Raw Text
                convertPdfToImages(fileBuffer)      // Layer 2: Visual Images
            ]);
            rawText = rawTextResult.text || "";
            images = pdfImages;
            console.log(`✅ Layer 1: Raw text extracted (${rawText.length} chars)`);
            console.log(`✅ Layer 2: PDF rendered to ${images.length} images`);
        } else {
            console.log("🖼️ Detected Image format (PNG/JPG). Skipping PDF extraction...");
            // Treat the input buffer as the single image
            // We assume it's an image if it's not a PDF.
            // Convert buffer to base64 data URI
            const base64Image = `data:image/png;base64,${fileBuffer.toString('base64')}`;
            images = [base64Image];
            console.log(`✅ Layer 2: Loaded 1 image from prompt input`);
        }

        // Layer 3: OCR (Run on images)
        // We run this only if we have images. It adds a few seconds but ensures we catch text in graphics.
        let ocrText = "";
        if (images.length > 0) {
            console.log("...Running Layer 3: OCR (this may take a moment)...");
            ocrText = await performOCR(images);
            console.log(`✅ Layer 3: OCR complete (${ocrText.length} chars)`);
        }

        // 2. Construct the Super Prompt (Strict 4-Layer Protocol)
        const systemPrompt = `
      You are an elite ATS Resume Parser with "God Mode" Vision capabilities.
      Your goal is to extract structured JSON data from a resume with 100% accuracy.
      
      You must utilize the "4-LAYER TRUTH PROTOCOL" to verify every data point:
      
      ### LAYER 1: VISUAL IMAGES (The Human Truth)
      - Look at the provided images of EVERY page.
      - **NAME EXTRACTION**: The Name is ALMOST ALWAYS the largest bold text at the top of Page 1.
      - **CRITICAL NEGATIVE CONSTRAINT**: "Experience", "Resume", "CV", "Curriculum Vitae", "Contact", "Summary" are **NEVER** the name. If the biggest text says "Experience", IGNORE IT and look for the actual name (likely smaller, or above/below it).
      - **CONTACT INFO**: Visually locate the email, phone, and links. They are often entering icons or column headers.
      - **STRUCTURE**: Use visual gaps and bold headers to distinguish "Experience" from "Projects".
      
      ### LAYER 2: OCR TEXT (The Scanned Truth)
      - Use the provided OCR text to decipher blurry or stylized fonts.
      - If Visual Layer is ambiguous, check OCR for exact spelling.
      
      ### LAYER 3: RAW TEXT (The Digital Truth)
      - Use provided raw text for precise character extraction (e.g. email addresses, URLs).
      - If OCR mistakes 'l' for '1', Raw Text usually has it right.
      
      ### LAYER 4: RAW FILE (The Source Truth)
      - You have the actual PDF file attached. Use internal metadata if all else fails.

      ### INSTRUCTIONS:
      1. **NAME**: Find the person's name. It is NOT "Experience". It is NOT "Resume". It is a human name.
      2. **CONTACT**: Extract Email, Phone, LinkedIn, Portfolio, Location.
      3. **SUMMARY**: If there is a paragraph at the start without a specific header, it is the Professional Summary.
      4. **EXPERIENCE vs PROJECTS**:
         - Experience = Employment history (Company, Title, Dates).
         - Projects = Specific work/apps built (often has 'Project' in header or description).
         - Do not mix them.
      5. **DATES**: Extract exact start/end dates.

      ### OUTPUT FORMAT:
      Return ONLY valid JSON matching this TypeScript interface:
      {
        name: string,
        email: string,
        phone: string,
        location: string,
        linkedin: string,
        links: string[],
        professional_summary: string, 
        experience: [{ title, company, location, duration, description[] }],
        education: [{ degree, institution, location, graduation_date, details[] }],
        skills: [{ category, items[] }],
        certifications: [{ name, issuer, date }],
        languages: string[]
      }
    `;

        const userPrompt = `
      ### INPUT DATA FOR ANALYSIS

      [LAYER 2: OCR TEXT FROM IMAGES]
      ${ocrText.substring(0, 30000)}

      [LAYER 3: RAW TEXT FROM PDF PARSER]
      ${rawText.substring(0, 30000)}

      [Instructions]
      Please process the attached IMAGES (Layer 1) and PDF FILE (Layer 4) along with the text above to generate the JSON.
    `;

        // 3. Prepare Files for Gemini
        console.log("📦 Preparing multi-modal payload: Images + Raw PDF...");

        // Part A: Page Images (Visual Layer)
        const multimodalParts = images.map(img => ({
            mimeType: "image/png",
            data: img.replace(/^data:image\/\w+;base64,/, "")
        }));

        if (isPdf) {
            // Part B: The Raw PDF File (Direct File Layer)
            // We append the actual PDF so Gemini can use its internal PDF parser as well
            multimodalParts.push({
                mimeType: "application/pdf",
                data: fileBuffer.toString("base64")
            });
        }

        console.log(`🤖 Sending payload to Gemini 2.0 Flash (Super Parser Mode)...`);
        console.log(`   - ${images.length} High-Res Page Screenshots`);
        console.log(`   - 1 Raw PDF File`);
        console.log(`   - Raw Text (${rawText.length} chars)`);
        console.log(`   - OCR Text (${ocrText.length} chars)`);

        // 4. Call AI
        // We pass the massive combined context
        const jsonString = await generateMultimodal(userPrompt, multimodalParts, systemPrompt);

        // 5. Parse and Validate JSON
        // Clean markdown code blocks if present
        const cleanJson = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData = JSON.parse(cleanJson);

        console.log(`✨ Super Parse Complete in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        return {
            parsed: parsedData,
            ocrText,
            images
        };

    } catch (error) {
        console.error("❌ Super Parse Failed:", error);
        throw error;
    }
}
