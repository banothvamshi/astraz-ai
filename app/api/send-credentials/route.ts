import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 }
            );
        }

        // Check if Resend API key is configured
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.log("RESEND_API_KEY not configured. Logging credentials for manual sending:");
            console.log(`Email: ${email}, Password: ${password}`);
            return NextResponse.json({
                success: true,
                message: "Credentials logged (email service not configured)"
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
                from: "Astraz AI <noreply@astraz.ai>",
                to: email,
                subject: "Welcome to Astraz AI - Your Login Credentials",
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .credentials { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; }
              .credential-item { margin: 10px 0; }
              .label { color: #64748b; font-size: 12px; text-transform: uppercase; }
              .value { color: #1e293b; font-size: 16px; font-weight: bold; background: #f1f5f9; padding: 10px; border-radius: 4px; margin-top: 4px; font-family: monospace; }
              .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Welcome to Astraz AI</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p>Thank you for your purchase! Your premium account has been created. Here are your login credentials:</p>
                
                <div class="credentials">
                  <div class="credential-item">
                    <div class="label">Email</div>
                    <div class="value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="label">Temporary Password</div>
                    <div class="value">${password}</div>
                  </div>
                </div>

                <div class="warning">
                  ⚠️ <strong>Important:</strong> For security, you'll be asked to set a new password when you first log in.
                </div>

                <center>
                  <a href="https://astraz.ai/login" class="button">Login to Your Account</a>
                </center>

                <p style="margin-top: 30px;">If you have any questions, reply to this email and we'll help you out!</p>
                
                <p>Best regards,<br>The Astraz AI Team</p>
              </div>
              <div class="footer">
                <p>© 2026 Astraz AI. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Email send error:", error);
            return NextResponse.json({ success: false, error: "Failed to send email" });
        }

        return NextResponse.json({ success: true, message: "Credentials sent successfully" });

    } catch (error) {
        console.error("Send credentials error:", error);
        return NextResponse.json(
            { error: "Failed to send credentials" },
            { status: 500 }
        );
    }
}
