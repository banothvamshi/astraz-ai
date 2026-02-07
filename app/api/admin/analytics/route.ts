
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
    try {
        // 1. Security Check: verify the requester is an admin
        const authClient = await createClient();
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        if (!profile || !profile.is_admin) {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        // 2. Fetch Data (using Service Role)
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "30d";

        // Determine date filter
        let startDate = new Date(0).toISOString(); // Default All Time
        const now = new Date();

        if (range === "7d") {
            const d = new Date(); d.setDate(d.getDate() - 7); startDate = d.toISOString();
        } else if (range === "30d") {
            const d = new Date(); d.setDate(d.getDate() - 30); startDate = d.toISOString();
        } else if (range === "90d") {
            const d = new Date(); d.setDate(d.getDate() - 90); startDate = d.toISOString();
        }

        // Parallel Fetching
        const [profilesRes, paymentsRes, generationsRes, visitsRes, activityRes] = await Promise.all([
            supabaseAdmin.from("profiles").select("id, is_premium, created_at, country"),
            supabaseAdmin.from("payments").select("amount, plan_type, created_at, status").eq("status", "captured").gte("created_at", startDate),
            supabaseAdmin.from("generations").select("id, user_id, created_at, ip_address").gte("created_at", startDate),
            supabaseAdmin.from("analytics_visits").select("visitor_id, created_at, ip_address").gte("created_at", startDate),
            supabaseAdmin.from("activity_log").select("action, metadata, created_at, user_id").gte("created_at", startDate).order('created_at', { ascending: false }).limit(1000)
        ]);

        // For Total Counts (All Time), we need separate queries if range != all
        // OR we just fetch everything and filter in memory? 
        // For Dashboard "Total Users" usually means ALL time, regardless of range?
        // Usually "Total Revenue" follows the range. "Total Users" usually means "Total Registered DB entries".
        // Let's modify:
        // Profiles: Always fetch ALL to get accurate Total Users count.
        // Payments/Generations: Fetch ALL for Total Counters, but filter for Charts?
        // Efficient way: Fetch ALL for tables that are small (<10MB).
        // Since we are fixing a bug where numbers are 0, fetching ALL is safest for now.

        // RE-FETCHING ALL (Overriding the .gte logic for simplicity and correctness of "Total" stats)
        // We will do in-memory filtering for the charts based on 'range'.

        const [allProfiles, allPayments, allGenerations, allVisits, allLogs] = await Promise.all([
            supabaseAdmin.from("profiles").select("id, is_premium, created_at, country"),
            supabaseAdmin.from("payments").select("amount, plan_type, created_at").eq("status", "captured"),
            supabaseAdmin.from("generations").select("id, user_id, created_at, ip_address"),
            supabaseAdmin.from("analytics_visits").select("visitor_id, created_at, ip_address, path, user_id"),
            supabaseAdmin.from("activity_log").select("action, metadata, created_at, user_id").order('created_at', { ascending: false }).limit(1000)
        ]);

        const profiles = allProfiles.data || [];
        const payments = allPayments.data || [];
        const generations = allGenerations.data || [];
        const visits = allVisits.data || [];
        const logs = allLogs.data || [];

        return NextResponse.json({
            profiles,
            payments,
            generations,
            visits,
            logs
        });

    } catch (error: any) {
        console.error("Admin Analytics API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
