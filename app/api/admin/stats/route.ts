import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key for full access
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, is_premium, is_admin, created_at, total_generations");

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
      // Return mock data if tables don't exist yet
      return NextResponse.json({
        stats: {
          totalUsers: 0,
          paidUsers: 0,
          freeUsers: 0,
          totalGenerations: 0,
          totalRevenue: 0,
          openTickets: 0,
        },
        users: [],
      });
    }

    // Fetch payments for revenue calculation
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, status")
      .eq("status", "completed");

    // Fetch generations count
    const { count: generationsCount } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true });

    // Fetch open support tickets
    const { count: openTicketsCount } = await supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");

    // Calculate stats
    const totalUsers = profiles?.length || 0;
    const paidUsers = profiles?.filter(p => p.is_premium)?.length || 0;
    const freeUsers = totalUsers - paidUsers;
    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Format users for table
    const formattedUsers = profiles?.map(p => ({
      id: p.id,
      email: p.email || "No email",
      created_at: p.created_at,
      is_premium: p.is_premium || false,
      generations_count: p.total_generations || 0,
    })) || [];

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsers,
        freeUsers,
        totalGenerations: generationsCount || 0,
        totalRevenue: totalRevenue / 100, // Convert from paise to rupees
        openTickets: openTicketsCount || 0,
      },
      users: formattedUsers,
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    // Return empty data on error
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        paidUsers: 0,
        freeUsers: 0,
        totalGenerations: 0,
        totalRevenue: 0,
        openTickets: 0,
      },
      users: [],
    });
  }
}
