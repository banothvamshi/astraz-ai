import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { createCanvas } from "canvas";

// Set worker source (required for Node.js usage)
// Note: In Next.js server environment, we might need a different approach or rely on the legacy build which doesn't always need a worker file path if configured right.
// However, typically pdfjs requires a worker. 
// For server-side node, we often mock the worker or use the 'legacy' build which includes a fake worker.
// We are importing from 'pdfjs-dist/legacy/build/pdf' which handles this better in Node.

/**
 * Converts a PDF buffer into an array of Base64 image strings (one per page).
 * This allows the AI to "see" the resume exactly as a human does.
 * 
 * @param pdfBuffer The raw PDF buffer
 * @param scale Quality scale (default 1.5 for decent OCR/Vision balance)
 * @returns Array of Base64 strings (image/png)
 */
export async function convertPdfToImages(pdfBuffer: Buffer, scale: number = 1.5): Promise<string[]> {
    try {
        // Convert Buffer to Uint8Array for PDF.js
        const uint8Array = new Uint8Array(pdfBuffer);

        // Load the document
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
            disableFontFace: true, // Optimizes loading
        });

        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        const images: string[] = [];

        // Process ALL pages as requested (High Quality)
        const maxPages = numPages; // No limit


        for (let i = 1; i <= maxPages; i++) {
            const page = await pdfDocument.getPage(i);

            const viewport = page.getViewport({ scale });

            // Creating a canvas with the viewport dimensions
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d");

            // Render the page onto the canvas
            await page.render({
                canvasContext: context as any, // Type cast for 'canvas' vs 'DOM' context mismatch
                viewport: viewport,
            }).promise;

            // Convert to Base64 (PNG is safer than JPEG for text sharpness)
            const base64Image = canvas.toDataURL("image/png");

            // Strip the prefix to get raw data if needed, or keep it for the AI helper
            // The AI helper (gemini.ts) expects: { mimeType: 'image/png', data: '...' }
            // So we'll return the full data URL and let the caller parse or just return clean data.
            // Let's return the full Data URL for clarity.
            images.push(base64Image);

            // Clean up page resources
            page.cleanup();
        }

        // Clean up document resources
        loadingTask.destroy();

        return images;

    } catch (error: any) {
        console.error("PDF to Image conversion failed:", error);
        // Return empty array instead of crashing; parsing will degrade to text-only
        return [];
    }
}
