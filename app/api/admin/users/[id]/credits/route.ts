import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        const { amount, reason } = await request.json();

        if (!amount || isNaN(amount)) {
            return NextResponse.json(
                { error: "Valid amount is required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // 1. Get current credits
        const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("credits_remaining")
            .eq("id", userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const currentCredits = profile.credits_remaining;
        // Handle unlimited credits (-1)
        if (currentCredits === -1 && amount > 0) {
            return NextResponse.json(
                { message: "User has unlimited credits. No change made." },
                { status: 200 }
            );
        }

        const newCredits = currentCredits === -1 ? -1 : Math.max(0, currentCredits + amount);

        // 2. Update credits
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                credits_remaining: newCredits,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (updateError) throw updateError;

        // 3. Log the action (optional: could add an audit_logs table later)
        console.log(`[Admin Audit] Credits adjusted for ${userId}: ${amount} (Reason: ${reason || "Manual adjustment"})`);

        return NextResponse.json({
            success: true,
            newCredits: newCredits,
            message: `Credits ${amount > 0 ? "added" : "deducted"} successfully.`
        });

    } catch (error) {
        console.error("Credit adjustment error:", error);
        return NextResponse.json(
            { error: "Failed to adjust credits" },
            { status: 500 }
        );
    }
}
