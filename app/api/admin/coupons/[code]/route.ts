import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { is_active } = await request.json();

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from("coupons")
            .update({ is_active })
            .eq("code", code);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Toggle coupon error:", error);
        return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
    }
}
