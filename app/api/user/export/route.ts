import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false,
                }
            }
        );

        let token = request.cookies.get('sb-access-token')?.value ||
            request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}-auth-token`)?.value;

        // PRIORITIZE Authorization header (Standard pattern)
        const authHeader = request.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        let userId = null;

        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use service role client for data fetching (bypasses RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch all user data
        const [profile, generations, history] = await Promise.all([
            supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
            supabaseAdmin.from("generations").select("*").eq("user_id", userId),
            supabaseAdmin.from("generations").select("*").eq("user_id", userId) // Using generations as history
        ]);

        const exportData = {
            user_profile: profile.data,
            generated_resumes: generations.data,
            resume_history: history.data,
            exported_at: new Date().toISOString()
        };

        return NextResponse.json(exportData);

    } catch (error: any) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
}
