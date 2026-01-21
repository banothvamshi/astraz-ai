import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        const { plan, credits } = await request.json();

        if (!plan) {
            return NextResponse.json(
                { error: "Plan type is required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Update user profile
        const { data: updatedUser, error } = await supabase
            .from("profiles")
            .update({
                is_premium: plan !== 'free',
                premium_type: plan,
                credits_remaining: credits, // Set specific credits for the plan
                updated_at: new Date().toISOString()
            })
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;

        // Log the upgrade
        console.log(`[Admin Audit] Plan manually updated for ${userId} to ${plan} with ${credits} credits`);

        return NextResponse.json({
            success: true,
            message: `User plan updated to ${plan} successfully.`,
            user: updatedUser
        });

    } catch (error: any) {
        console.error("Plan upgrade error:", error);
        return NextResponse.json(
            {
                error: "Failed to update plan",
                details: error?.message || String(error),
                stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
            },
            { status: 500 }
        );
    }
}
