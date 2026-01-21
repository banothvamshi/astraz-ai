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

        // Get the session token from cookies
        const token = request.cookies.get('sb-access-token')?.value ||
            request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}-auth-token`)?.value;

        let userId = null;

        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user) userId = user.id;
        }

        // Fallback: Try to get user from Authorization header if cookie failed
        if (!userId) {
            // Basic check - in a real app reliant on middleware, we might trust the header/cookie more
            // For now, if no user, return 401
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all user data
        const [profile, generations, history] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", userId).single(),
            supabase.from("generations").select("*").eq("user_id", userId),
            supabase.from("pdf_history").select("*").eq("user_id", userId)
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
