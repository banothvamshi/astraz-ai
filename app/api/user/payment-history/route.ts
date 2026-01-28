import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false } }
        );

        // Get token from Authorization header
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.substring(7);

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use service role for database fetch (bypassing RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: payments, error: dbError } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (dbError) {
            console.error("Payment history fetch error:", dbError);
            return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 });
        }

        return NextResponse.json({ success: true, payments });

    } catch (error: any) {
        console.error("Payment history error:", error);
        return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 });
    }
}
