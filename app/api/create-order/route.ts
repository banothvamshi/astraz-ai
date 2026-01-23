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

    // Server-side coupon validation (Atomic)
    if (coupon_code) {
      const supabase = getSupabaseAdmin();

      // Use the new atomic RPC function
      const { data: couponResult, error: couponError } = await supabase
        .rpc("redeem_coupon", { coupon_code: coupon_code });

      if (couponResult && couponResult.length > 0) {
        const { success, discount_val, discount_type_result } = couponResult[0];

        if (success) {
          const originalAmount = amount;
          if (discount_type_result === 'percent') {
            const discount = Math.floor(originalAmount * (discount_val / 100));
            finalAmount = Math.max(0, originalAmount - discount);
          } else {
            // Flat discount
            const discount = discount_val * 100;
            finalAmount = Math.max(0, originalAmount - discount);
          }
          // Use the coupon code as ID/Reference
          couponId = coupon_code;
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
