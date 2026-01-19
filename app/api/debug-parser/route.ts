
import { NextRequest, NextResponse } from "next/server";
import { parsePDFReliable } from "@/lib/pdf-parser-simple";
import { parseUniversalDocument } from "@/lib/universal-document-parser-v2";
import { normalizeResume } from "@/lib/resume-normalizer";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // STAGE 0: Parse
        let text = "";
        try {
            console.log("Debug: parsing with simple parser");
            text = await parsePDFReliable(buffer);

            // If simple parser returns too little text (likely just headers), try universal
            if (text.length < 200) {
                console.log("Debug: simple parser result too short, trying universal");
                throw new Error("Text too short");
            }
        } catch (e) {
            console.log("Debug: simple parser failed or insufficient, trying universal");
            try {
                const res = await parseUniversalDocument(buffer);
                text = res.text;
            } catch (universalError: any) {
                console.log("Debug: Universal parser also failed");
                // If we have some text from simple parser, use it as fallback
                if (text.length === 0) throw universalError;
            }
        }

        // STAGE 1: Normalize
        let normalized;
        try {
            normalized = await normalizeResume(text);
        } catch (e: any) {
            return NextResponse.json({
                error: "Normalization failed",
                details: e.message,
                rawText: text
            }, { status: 500 });
        }

        return NextResponse.json({
            rawText: text,
            normalized: normalized
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
