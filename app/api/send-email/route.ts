import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { to, subject, html } = await request.json();

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: "Missing required fields: to, subject, html" },
                { status: 400 }
            );
        }

        // Check if Resend API key is configured
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.log("RESEND_API_KEY not configured. Mocking email send:");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            return NextResponse.json({
                success: true,
                message: "Email logged (service not configured)"
            });
        }

        // Send email via Resend
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: "Astraz AI <contact@astraz.ai>", // Support email as sender
                to: to,
                subject: subject,
                html: html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Resend API error:", error);
            return NextResponse.json({ success: false, error: "Failed to send email via provider" }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Send email error:", error);
        return NextResponse.json(
            { error: "Internal server error during email dispatch" },
            { status: 500 }
        );
    }
}
