import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ valid: false, message: "Code required" }, { status: 400 });
        }


        const supabase = getSupabaseAdmin();
        const { data: coupon, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("code", code.toUpperCase())
            .single();

        if (error || !coupon) {
            return NextResponse.json({ valid: false, message: "Invalid coupon code" }, { status: 404 });
        }

        // Validation Login
        if (!coupon.is_active) {
            return NextResponse.json({ valid: false, message: "Coupon is inactive" }, { status: 400 });
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return NextResponse.json({ valid: false, message: "Coupon expired" }, { status: 400 });
        }

        if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
            return NextResponse.json({ valid: false, message: "Coupon usage limit reached" }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            code: coupon.code
        });

    } catch (error) {
        console.error("Coupon validation error:", error);
        return NextResponse.json({ valid: false, message: "Server error" }, { status: 500 });
    }
}
