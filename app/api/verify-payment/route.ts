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
    } = await request.json();

    // Determine credits based on plan (monthly subscription)
    const planCredits = credits || (
      plan_type === 'enterprise' ? 100 :
        plan_type === 'professional' ? 30 :
          10 // starter default
    );

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
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

      // Get current credits
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("credits_remaining")
        .eq("id", userId)
        .single();

      const currentCredits = currentProfile?.credits_remaining || 0;
      const newCredits = planCredits === -1 ? -1 : currentCredits + planCredits;

      await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_type: plan_type || "premium",
          credits_remaining: newCredits,
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
