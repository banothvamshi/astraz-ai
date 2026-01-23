import { createWorker } from "tesseract.js";

/**
 * Clean up OCR text (basic normalization)
 */
function cleanOCRText(text: string): string {
    return text
        .replace(/\|\s*$/gm, "") // Remove common table borders at end of line
        .replace(/^\s*\|/gm, "") // Remove common table borders at start
        .replace(/\r\n/g, "\n")
        .trim();
}

/**
 * Performs OCR on a list of Base64 images.
 * Returns a combined string of all extracted text.
 * 
 * @param images Array of Base64 image strings (data:image/png;base64,...)
 * @returns Combined textual content from all images
 */
export async function performOCR(images: string[]): Promise<string> {
    if (!images || images.length === 0) return "";

    try {
        const worker = await createWorker('eng');
        let combinedText = "";

        for (let i = 0; i < images.length; i++) {
            // Tesseract accepts Base64 directly
            const { data: { text } } = await worker.recognize(images[i]);

            combinedText += `\n--- Page ${i + 1} (OCR) ---\n`;
            combinedText += cleanOCRText(text);
            combinedText += "\n";
        }

        await worker.terminate();
        return combinedText;

    } catch (error: any) {
        console.error("OCR Processing failed:", error);
        // Return empty string on failure; pipeline should continue with just visual/raw text
        return "";
    }
}
