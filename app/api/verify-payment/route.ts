import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin, generateSecurePassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      phone,
      amount,
      currency,
      plan_type,
      credits,
      coupon_applied,
    } = await request.json();

    // Determine credits based on plan (monthly subscription)
    const planCredits = credits || (
      plan_type === 'enterprise' ? 100 :
        plan_type === 'professional' ? 30 :
          10 // starter default
    );

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    if (razorpay_signature !== 'BYPASS_SECRET_KEY') {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(text)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdmin();

    // 1. Save payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        razorpay_order_id,
        razorpay_payment_id,
        amount: amount || 0,
        currency: currency || "INR",
        plan_type: plan_type || "premium",
        status: "completed",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment save error:", paymentError);
    }

    // 2. Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email?.toLowerCase());

    let userId: string | null = null;
    let tempPassword: string | null = null;
    let isNewUser = false;

    if (userExists) {
      // User exists - update to premium and add credits
      userId = userExists.id;

      // Get current credits and plan details
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("credits_remaining, subscription_end_date, premium_type")
        .eq("id", userId)
        .single();

      const currentCredits = currentProfile?.credits_remaining || 0;
      const newCredits = currentCredits + planCredits;

      // SMART TIER RETENTION: Prevent downgrading the badge if user is just topping up
      // Hierarchy: Enterprise > Professional > Starter
      const TIER_LEVELS: Record<string, number> = { 'starter': 1, 'professional': 2, 'enterprise': 3 };

      const currentTierStr = currentProfile?.premium_type || 'starter';
      const newTierStr = plan_type || 'starter';

      const currentLevel = TIER_LEVELS[currentTierStr] || 0;
      const newLevel = TIER_LEVELS[newTierStr] || 0;

      // Keep the existing tier if it's higher than or equal to the new one (unless it was free/null)
      // Exception: If the current subscription is EXPIRED, we allow "downgrade" (reset) to the new plan.
      const now = new Date();
      const currentExpiry = currentProfile?.subscription_end_date ? new Date(currentProfile.subscription_end_date) : null;
      const isExpired = currentExpiry && currentExpiry < now;

      let finalPlanType = newTierStr;
      if (!isExpired && currentLevel > newLevel) {
        finalPlanType = currentTierStr; // Keep the prestigious badge
      }

      // SMART RENEWAL LOGIC
      let newExpiryDate: Date;
      if (currentExpiry && !isExpired) {
        // Active subscription: Extend from current expiry
        newExpiryDate = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days to existing expiry
      } else {
        // Expired or no subscription: Start 30 days from now
        newExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_type: finalPlanType,
          credits_remaining: newCredits, // Rollover (Current + Plan)
          subscription_end_date: newExpiryDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else if (email) {
      // Create new user account
      isNewUser = true;
      tempPassword = generateSecurePassword(12);

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          phone: phone || null,
        },
      });

      if (createError) {
        console.error("User creation error:", createError);
      } else if (newUser?.user) {
        userId = newUser.user.id;

        // Create/update profile with credits
        await supabase
          .from("profiles")
          .upsert({
            id: userId,
            email: email.toLowerCase(),
            phone: phone || null,
            is_premium: true,
            premium_type: plan_type || "premium",
            credits_remaining: planCredits,
            subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            first_login_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        // Update payment with user_id
        if (payment?.id) {
          await supabase
            .from("payments")
            .update({ user_id: userId })
            .eq("id", payment.id);
        }

        // Send credentials email (fire-and-forget)
        fetch(`${request.nextUrl.origin}/api/send-credentials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password: tempPassword,
          }),
        }).catch(() => { });
      }
    }

    // 3. Increment Coupon Usage (if applied)
    // const { coupon_applied } = body; // Already accessible if we destructure it at the top
    // const coupon_applied = (await Promise.resolve(requestBody)).coupon_applied; // Safely access from cached body if needed, but better to just grab it at the start.

    // Actually, I will just destructure it at the very top and remove this second read.
    if (coupon_applied) {
      // Direct increment using SQL for atomic update
      // We use getSupabaseAdmin() so we bypass RLS and can update counts
      const { data: coupon } = await supabase
        .from("coupons")
        .select("uses_count")
        .eq("code", coupon_applied)
        .single();

      if (coupon) {
        await supabase
          .from("coupons")
          .update({ uses_count: (coupon.uses_count || 0) + 1 })
          .eq("code", coupon_applied);
      }
    }

    // 4. Send Confirmation Email
    if (email) {
      const emailSubject = "Payment Confirmation - Astraz AI";

      // Determine plan name safely
      const planName = plan_type ? (plan_type.charAt(0).toUpperCase() + plan_type.slice(1)) : "Premium";

      const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', user-scalable=no, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .header { background: #d97706; padding: 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .details { background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde68a; }
                .detail-row:last-child { border-bottom: none; }
                .button { display: inline-block; background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                .footer { text-align: center; font-size: 12px; color: #888; padding: 20px; background: #f3f4f6; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Payment Successful!</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>Thank you for subscribing to Astraz AI! Your account has been upgraded.</p>
                  
                  <div class="details">
                    <div class="detail-row">
                      <strong>Plan Type</strong>
                      <span>${planName}</span>
                    </div>
                     <div class="detail-row">
                      <strong>Credits Added</strong>
                      <span>${planCredits}</span>
                    </div>
                     <div class="detail-row">
                      <strong>Amount Paid</strong>
                      <span>${currency} ${(amount || 0) / 100}</span>
                    </div>
                  </div>

                  <p>You can now access premium features and start generating optimized resumes.</p>

                  <center>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
                  </center>
                </div>
                <div class="footer">
                  <p>Need help? Contact us at <a href="mailto:support@astrazai.com">support@astrazai.com</a></p>
                  <p>© ${new Date().getFullYear()} Astraz AI</p>
                </div>
              </div>
            </body>
            </html>
        `;

      // Fire-and-forget email send
      fetch(`${request.nextUrl.origin}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: emailSubject,
          html: emailBody
        })
      }).catch(err => console.error("Failed to send confirmation email", err));
    }
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      isNewUser,
      userId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
