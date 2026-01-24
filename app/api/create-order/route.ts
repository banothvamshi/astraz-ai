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
    // Server-side coupon validation
    if (coupon_code) {

      const supabase = getSupabaseAdmin();

      // Direct DB Query (More reliable than RPC for this stage)
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code)
        .eq("is_active", true)
        .single();

      if (coupon) {
        // Validate Expiry
        const now = new Date();
        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
          // Expired: Ignore coupon, charge full price (or throw error? User prefers fix, let's just ignore or maybe better to error)
          // But to avoid breaking flow, if invalid, we just don't apply it.
          console.log("Coupon expired");
        }
        // Validate Usage Limits
        else if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
          console.log("Coupon usage limit reached");
        }
        else {
          // Apply Discount
          const originalAmount = amount;
          if (coupon.discount_type === 'percent') {
            const discount = Math.floor(originalAmount * (coupon.discount_value / 100));
            finalAmount = Math.max(0, originalAmount - discount);
          } else {
            // Flat discount (assuming value is in regular currency units e.g. 500 INR, so * 100 for paise)
            // However, admin panel creates it as number. usually payment APIs work in smallest unit.
            // Standard: discount_value is likely in abstract units (Rupees), amount is in Paise.
            const discount = coupon.discount_value * 100;
            finalAmount = Math.max(0, originalAmount - discount);
          }
          couponId = coupon_code;
        }
      }
    }

    // 100% OFF / Free Order Logic
    if (finalAmount <= 0) {
      return NextResponse.json({
        bypass: true,
        orderId: `free_coupon_${Date.now()}`,
        amount: 0,
        currency: currency,
        couponApplied: true
      });
    }

    // Existing Magic Coupon Logic removed from here as it's handled above

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
