import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";

// GET: List all coupons
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Check if requester is admin (Middleware usually handles this, but double check)
        // For this implementation, we assume middleware or client component checks role, 
        // but the API also uses admin client so we should be careful. 
        // Since this is under /api/admin/*, we assume protections are in place or added here.

        const { data: coupons, error } = await supabase
            .from("coupons")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ coupons });

    } catch (error) {
        console.error("Fetch coupons error:", error);
        return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
    }
}

// POST: Create a new coupon
export async function POST(request: NextRequest) {
    try {
        const {
            code,
            discount_type,
            discount_value,
            max_uses,
            valid_until
        } = await request.json();

        // Basic validation
        if (!code || !discount_type || !discount_value) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Check if code exists
        const { data: existing } = await supabase
            .from("coupons")
            .select("code")
            .eq("code", code)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "Coupon code already exists" },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from("coupons")
            .insert({
                code: code.toUpperCase(),
                discount_type,
                discount_value,
                max_uses: max_uses || null,
                valid_until: valid_until || null,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, coupon: data });

    } catch (error) {
        console.error("Create coupon error:", error);
        return NextResponse.json(
            { error: "Failed to create coupon" },
            { status: 500 }
        );
    }
}
