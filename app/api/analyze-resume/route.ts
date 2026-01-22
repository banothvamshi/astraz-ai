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

        // Parse PDF
        const parsed = await parseResumePDF(pdfBuffer);

        // Calculate Score
        const scoreData = calculateResumeScore(parsed.text);

        return NextResponse.json({
            success: true,
            score: scoreData
        });

    } catch (error: any) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze resume" },
            { status: 500 }
        );
    }
}
