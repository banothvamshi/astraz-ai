import { NextRequest, NextResponse } from "next/server";
import { parseResumePDF } from "@/lib/pdf-parser";
import { calculateResumeScore } from "@/lib/resume-scorer";
import { shouldAllowAPICall, getBillingStatusMessage } from "@/lib/billing-guard";

export async function POST(request: NextRequest) { // Sync v2
    try {
        // Check billing guard
        if (!shouldAllowAPICall()) {
            return NextResponse.json(
                { error: getBillingStatusMessage() },
                { status: 503 }
            );
        }

        const { resume } = await request.json();

        if (!resume) {
            return NextResponse.json(
                { error: "No resume provided" },
                { status: 400 }
            );
        }

        let base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
        const pdfBuffer = Buffer.from(base64Data, "base64");

        // Parse PDF (Super Parser Mode) with Fallback
        let parsed: any = {};
        let textForScoring = "";

        try {
            const { superParseResume } = await import("@/lib/super-parser");
            const result = await superParseResume(pdfBuffer);
            parsed = result.parsed;
            textForScoring = JSON.stringify(parsed, null, 2) + "\n\n" + (parsed.professional_summary || "");
        } catch (superParseError) {
            console.error("Super Parser failed in analysis, falling back to simple parser:", superParseError);
            // Fallback to simple parser
            const { parseResumePDF } = await import("@/lib/pdf-parser");
            const simpleResult = await parseResumePDF(pdfBuffer);
            textForScoring = simpleResult.text;
            // Attempt basic extraction from raw text for contact info
            parsed = {
                name: "",
                email: "",
                phone: "",
                location: "",
                linkedin: ""
            };
            // Note: Simple parser doesn't extract fields, so auto-fill might be empty, but 500 error is avoided.
            // Further enhancement: use regex extractor on simple text if needed.
        }

        // Calculate Score
        const scoreData = calculateResumeScore(textForScoring);

        return NextResponse.json({
            success: true,
            score: scoreData,
            parsed: parsed // Return parsed data for auto-filling
        });

    } catch (error: any) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze resume" },
            { status: 500 }
        );
    }
}
