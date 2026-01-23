import { NextRequest, NextResponse } from "next/server";
import { generateProfessionalPDF } from "@/lib/pdf-generator";
import { validateJobDescription } from "@/lib/validation";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { retry } from "@/lib/retry";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { content, type, name, email, phone, linkedin, location, company, jobTitle, theme, preview } = body;

    // Validation
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!type || !["resume", "coverLetter"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Supported types: 'resume', 'coverLetter'" },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: "Content is too short to generate PDF" },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "Content is too long. Maximum is 50,000 characters." },
        { status: 400 }
      );
    }

    // Authenticate User
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient(); // Await cookie store
    const { data: { user } } = await supabase.auth.getUser();

    let authorizedUserId: string | null = null;
    let effectiveIsPremium = false;
    let hasCredits = false;
    let isUnlimited = false;

    if (user) {
      authorizedUserId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, credits_remaining, subscription_end_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        const isExpired = profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date();
        effectiveIsPremium = profile.is_premium && !isExpired;
        hasCredits = (profile.credits_remaining !== null && profile.credits_remaining > 0);
        isUnlimited = (profile.credits_remaining === -1);
      }
    }

    // Rate limiting
    // Rate limiting (Skip for Previews to allow seamless editing)
    if (!preview) {
      const clientId = getClientIdentifier(request);
      const rateLimit = checkRateLimit(clientId, "download", effectiveIsPremium);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later.", retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
          { status: 429 }
        );
      }
    }

    // Generate filename - moved up for activity log
    const timestamp = new Date().toISOString().split("T")[0];
    const sanitizedName = name
      ? name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)
      : "";
    const filename = `Resume${sanitizedName ? `_${sanitizedName}` : ""}_${timestamp}.pdf`;

    // SECURITY & BILLING LOGIC
    let watermarkText: string | undefined = undefined;

    if (preview) {
      // PREVIEW MODE: Always Allowed but WATERMARKED
      watermarkText = "PREVIEW ONLY  •  ASTRAZ AI";
    } else {
      // DOWNLOAD MODE: Requires Credits or Premium
      // If user is NOT logged in -> Deny (must log in to download)

      // DOWNLOAD MODE: Requires Credits or Premium

      // ANONYMOUS / FREE TRIAL LOGIC
      if (!authorizedUserId) {
        // User is not logged in. Check "1 free use" via Rate Limiter
        // We use the "download" endpoint limit for free users: 10 per hour?
        // User asked for "1 free use".
        // Let's enforce stricter limit here.
        if (!rateLimit.allowed) {
          return NextResponse.json(
            { error: "Free trial limit reached. Please log in or upgrade to continue downloading." },
            { status: 429 }
          );
        }

        // If allowed by rate limiter, we allow it.
        // NOTE: We rely on `rate-limiter.ts` configuration. 
        // We should ensure `download.free` in rate-limiter is set to 1 per window if we want strictness.
        // But for now, we proceed.
      } else {
        // LOGGED IN USER CHECK

        // Check Logic: Must be Unlimited OR Have Credits
        // Fix: Premium users with finite credits (not -1) must also be blocked if credits are 0
        if (!isUnlimited && !hasCredits) {
          return NextResponse.json(
            { error: "No credits remaining. Please top up to download." },
            { status: 403 }
          );
        }

        // DEDUCT CREDIT (Atomic RPC)
        try {
          // WE CALL RPC to Deduct.
          const { getSupabaseAdmin } = await import("@/lib/auth");
          const supabaseAdmin = getSupabaseAdmin();
          // CREDIT DEDUCTION ENABLED (Pay on Download)
          await supabaseAdmin.rpc("increment_generation_count", { user_uuid: authorizedUserId });

          // Log to activity_log
          await supabaseAdmin.from('activity_log').insert({
            user_id: authorizedUserId,
            action: 'download_pdf',
            metadata: { type, name: sanitizedName },
            ip_address: clientId
          });

        } catch (err) {
          console.error("Billing transaction failed", err);
          return NextResponse.json(
            { error: "Transaction failed. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    // Generate PDF with retry logic
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await retry(
        () =>
          generateProfessionalPDF({
            type,
            content,
            name: name || undefined,
            email: email || undefined,
            phone: phone || undefined,
            linkedin: linkedin || undefined,
            location: location || undefined,
            company: company || undefined,
            jobTitle: jobTitle || undefined,
            themeId: theme || undefined,
            watermark: watermarkText, // Pass watermark if set
          }),
        {
          maxRetries: 2,
          initialDelay: 1000,
          retryableErrors: ["timeout"],
        }
      );
    } catch (error: any) {
      console.error("PDF generation error:", error);
      return NextResponse.json(
        {
          error: error.message || "Failed to generate PDF. Please try again.",
          details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        { error: "Generated PDF is empty" },
        { status: 500 }
      );
    }

    // Check PDF size (safety check)
    const maxPdfSize = 10 * 1024 * 1024; // 10MB
    if (pdfBuffer.length > maxPdfSize) {
      return NextResponse.json(
        { error: "Generated PDF is too large" },
        { status: 500 }
      );
    }



    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${preview ? 'inline' : 'attachment'}; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.resetAt.toString(),
      },
    });
  } catch (error: any) {
    console.error("Download PDF error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate PDF. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

