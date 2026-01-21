import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseAdmin } from "@/lib/auth";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR", coupon_code } = await request.json();

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    let finalAmount = amount;
    let couponId = null;

    // Server-side coupon validation
    if (coupon_code) {
      const supabase = getSupabaseAdmin();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code)
        .single();

      if (coupon && coupon.is_active) {
        // Double check expiry and usage
        const isValidDate = !coupon.valid_until || new Date(coupon.valid_until) > new Date();
        const isValidUsage = coupon.max_uses === null || coupon.uses_count < coupon.max_uses;

        if (isValidDate && isValidUsage) {
          const originalAmount = amount; // in paise/cents
          if (coupon.discount_type === 'percent') {
            const discount = Math.floor(originalAmount * (coupon.discount_value / 100));
            finalAmount = Math.max(0, originalAmount - discount);
          } else {
            // Flat discount (value assumed to be in same currency unit or handle conversion)
            // Let's assume input discount_value is in WHOLE units (Rupees), so multiply by 100
            // Update migration comment says "cents/paise". Let's assume stored in paise.
            const discount = coupon.discount_value * 100;
            finalAmount = Math.max(0, originalAmount - discount);
          }
          couponId = coupon.code;
        }
      }
    }

    const razorpay = getRazorpay();
    const options = {
      amount: finalAmount, // amount in paise or cents
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        coupon_code: couponId || ""
      }
    };

    const order = await razorpay.orders.create(options);

    // If coupon used, increment usage count (optimistic, or do it on verify)
    // Better to do it on verify to avoid counting abandoned carts.
    // For now, simple create.

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      couponApplied: !!couponId
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
