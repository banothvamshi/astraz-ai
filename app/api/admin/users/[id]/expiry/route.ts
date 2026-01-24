import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { expiryDate, clear } = body;

        const supabase = getSupabaseAdmin();

        let updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (clear) {
            updateData.subscription_end_date = null;
            // If clearing expiry, usually means permanent access, but let's just clear the date.
            // We might want to keep is_premium true.
            updateData.is_premium = true;
        } else if (expiryDate) {
            updateData.subscription_end_date = new Date(expiryDate).toISOString();
            updateData.is_premium = true;
        } else {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update expiry error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update expiry" },
            { status: 500 }
        );
    }
}
