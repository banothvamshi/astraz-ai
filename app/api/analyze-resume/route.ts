import { NextRequest, NextResponse } from "next/server";
import { parseResumePDF } from "@/lib/pdf-parser";
import { calculateResumeScore } from "@/lib/resume-scorer";
import { shouldAllowAPICall, getBillingStatusMessage } from "@/lib/billing-guard";

export async function POST(request: NextRequest) {
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

        // Parse PDF (Super Parser Mode)
        const { superParseResume } = await import("@/lib/super-parser");
        const parsed = await superParseResume(pdfBuffer);

        // Convert the structural summary to a text block for the scoring engine
        const textForScoring = JSON.stringify(parsed, null, 2) + "\n\n" + (parsed.professional_summary || "");

        // Calculate Score
        const scoreData = calculateResumeScore(textForScoring);

        success: true,
            score: scoreData,
                parsed: parsed, // Return parsed data for auto-filling

    } catch (error: any) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze resume" },
            { status: 500 }
        );
    }
}
