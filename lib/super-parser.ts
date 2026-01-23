import { generateMultimodal } from "./gemini";
import { convertPdfToImages } from "./pdf-image-converter";
import { performOCR } from "./ocr-processor";
const pdf = require("pdf-parse");

export interface ParsedResume {
    name: string;
    email: string;
    phone: string;
    location: string;
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
export async function superParseResume(fileBuffer: Buffer): Promise<ParsedResume> {
    console.log("🚀 Starting Super Parser Pipeline...");
    const startTime = Date.now();

    try {
        // 1. Parallel Execution of Extraction Layers
        const [rawTextResult, images] = await Promise.all([
            pdf(fileBuffer).catch((e: any) => ({ text: "" })), // Layer 1: Raw Text
            convertPdfToImages(fileBuffer)      // Layer 2: Visual Images
        ]);

        const rawText = rawTextResult.text || "";
        console.log(`✅ Layer 1: Raw text extracted (${rawText.length} chars)`);
        console.log(`✅ Layer 2: PDF rendered to ${images.length} images`);

        // Layer 3: OCR (Run on images)
        // We run this only if we have images. It adds a few seconds but ensures we catch text in graphics.
        let ocrText = "";
        if (images.length > 0) {
            console.log("...Running Layer 3: OCR (this may take a moment)...");
            ocrText = await performOCR(images);
            console.log(`✅ Layer 3: OCR complete (${ocrText.length} chars)`);
        }

        // 2. Construct the Super Prompt
        const systemPrompt = `
      You are an expert ATS Resume Parser with "Vision" capabilities.
      Your goal is to extract structured JSON data from a resume with 100% accuracy.
      
      You have access to THREE sources of truth:
      1. VISUAL IMAGES of the resume pages (Use these to understand layout, headers, and structure).
      2. RAW TEXT extracted from the file (Use this for precise character data).
      3. OCR TEXT extracted from the images (Use this to verify text that might be encoded weirdly).

      INSTRUCTIONS:
      - CROSS-REFERENCE all three sources (Visual, Text, OCR).
      - **CONTACT INFO**: Search Header and Footer aggressively for Name, Email, Phone, and Location. 
      - **ANTI-HALLUCINATION RULE**: Do NOT invent data. But if you see it, capture it even if formatting is weird.
      - **SUMMARY vs EXPERIENCE**: A paragraph at the top without a "Experience" header is usually a Summary. Extract it as 'professional_summary'.
      - If Raw Text is garbled, trust the Visual/OCR.
      - If Visual is blurry, trust the Raw Text.
      - Infer the structure (Experience vs Education) based on the Visual Layout (bold headers, sizes).
      - Correct common OCR errors (e.g., '1' vs 'l', '0' vs 'O').
      - Split combined lines properly based on visual gap.
      - **Critical**: Ensure the 'description' arrays in 'experience' contain the FULL original content, just cleaned up. Do not summarize yet.

      OUTPUT FORMAT:
      Return ONLY valid JSON matching this TypeScript interface:
      {
        name: string,
        email: string,
        phone: string,
        location: string,
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
      Here is the Raw Text:
      ${rawText.substring(0, 20000)}

      Here is the OCR Text:
      ${ocrText.substring(0, 20000)}

      Please process the attached images and texts to generate the perfect JSON.
    `;

        // 3. Prepare Files for Gemini
        console.log("📦 Preparing multi-modal payload: Images + Raw PDF...");

        // Part A: Page Images (Visual Layer)
        const multimodalParts = images.map(img => ({
            mimeType: "image/png",
            data: img.replace(/^data:image\/\w+;base64,/, "")
        }));

        // Part B: The Raw PDF File (Direct File Layer)
        // We append the actual PDF so Gemini can use its internal PDF parser as well
        multimodalParts.push({
            mimeType: "application/pdf",
            data: fileBuffer.toString("base64")
        });

        console.log(`🤖 Sending payload to Gemini 2.0 Flash (Super Parser Mode)...`);
        console.log(`   - ${images.length} Page Screenshots`);
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
        return parsedData;

    } catch (error) {
        console.error("❌ Super Parse Failed:", error);
        throw error;
    }
}
