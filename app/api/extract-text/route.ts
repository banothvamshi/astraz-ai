/**
 * Simple PDF Text Extractor - Just get the raw text
 * No complications, just extract text from PDF
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume } = body;

    if (!resume) {
      return NextResponse.json({ error: "Resume required" }, { status: 400 });
    }

    console.log("\n" + "=".repeat(70));
    console.log("SIMPLE PDF TEXT EXTRACTION");
    console.log("=".repeat(70));

    // Convert base64 to buffer
    const base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
    const buffer = Buffer.from(base64Data, "base64");

    console.log(`Buffer size: ${buffer.length} bytes`);
    console.log(`First 20 bytes: ${buffer.slice(0, 20).toString()}`);

    // Try pdf-parse
    let text = "";
    try {
      console.log("\nTrying pdf-parse...");
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
      console.log(`✅ pdf-parse succeeded`);
      console.log(`Pages: ${pdfData.numpages}`);
      console.log(`Characters: ${text.length}`);
    } catch (error: any) {
      console.error(`❌ pdf-parse failed: ${error.message}`);

      // Try pdfjs-dist
      try {
        console.log("\nTrying pdfjs-dist...");
        const pdfjs = await import("pdfjs-dist");
        (pdfjs as any).GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdf = await (pdfjs as any).getDocument({ data: buffer }).promise;
        const texts: string[] = [];

        for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");
          if (pageText.trim()) {
            texts.push(pageText);
          }
        }

        text = texts.join("\n");
        console.log(`✅ pdfjs-dist succeeded`);
        console.log(`Pages: ${pdf.numPages}`);
        console.log(`Characters: ${text.length}`);
      } catch (pdfJsError: any) {
        console.error(`❌ pdfjs-dist failed: ${pdfJsError.message}`);
        throw pdfJsError;
      }
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          error: "No text extracted from PDF",
          suggestion: "PDF might be image-based or corrupted",
        },
        { status: 400 }
      );
    }

    console.log("\n" + "-".repeat(70));
    console.log("EXTRACTED TEXT PREVIEW (first 1000 chars):");
    console.log("-".repeat(70));
    console.log(text.substring(0, 1000));
    console.log("\n" + "=".repeat(70) + "\n");

    return NextResponse.json({
      success: true,
      extracted_text_length: text.length,
      estimated_pages: Math.ceil(text.length / 2000),
      text_preview: text.substring(0, 500),
      full_text: text, // Return the full text
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
