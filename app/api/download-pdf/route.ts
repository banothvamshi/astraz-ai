import { NextRequest, NextResponse } from "next/server";
import { generateProfessionalPDF } from "@/lib/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const { content, type, name, email } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!type || (type !== "resume" && type !== "coverLetter")) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'resume' or 'coverLetter'" },
        { status: 400 }
      );
    }

    // Generate professional PDF
    const pdfBuffer = await generateProfessionalPDF({
      type,
      content,
      name,
      email,
    });

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${type === "resume" ? "Resume" : "CoverLetter"}_${timestamp}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF. Please try again." },
      { status: 500 }
    );
  }
}
