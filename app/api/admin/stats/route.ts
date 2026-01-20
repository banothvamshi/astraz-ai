import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        // For now, we'll use mock data since Supabase may not be fully configured
        // In production, uncomment the Supabase queries below

        /*
        // Verify admin access
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        // Fetch stats from Supabase
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, email, created_at, is_admin");
    
        const { data: subscriptions, error: subsError } = await supabase
          .from("user_subscriptions")
          .select("user_id, is_premium");
    
        const { data: generations, error: genError } = await supabase
          .from("generations")
          .select("id, user_id, job_title, company_name, created_at");
    
        const { data: payments, error: payError } = await supabase
          .from("payments")
          .select("id, user_id, amount, status");
    
        const { data: tickets, error: ticketError } = await supabase
          .from("support_tickets")
          .select("id, status")
          .eq("status", "open");
        */

        // Mock data for demonstration
        const mockStats = {
            totalUsers: 127,
            paidUsers: 34,
            freeUsers: 93,
            totalGenerations: 456,
            totalRevenue: 10166, // In rupees
            openTickets: 3,
        };

        const mockUsers = [
            { id: "1", email: "john@example.com", created_at: "2024-01-15", is_premium: true, generations_count: 12 },
            { id: "2", email: "jane@example.com", created_at: "2024-01-18", is_premium: false, generations_count: 3 },
            { id: "3", email: "bob@example.com", created_at: "2024-01-20", is_premium: true, generations_count: 8 },
            { id: "4", email: "alice@example.com", created_at: "2024-01-22", is_premium: false, generations_count: 1 },
            { id: "5", email: "charlie@example.com", created_at: "2024-01-25", is_premium: true, generations_count: 15 },
        ];

        return NextResponse.json({
            stats: mockStats,
            users: mockUsers,
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin stats" },
            { status: 500 }
        );
    }
}
