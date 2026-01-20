import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ pdfHistory: [], tickets: [] });
        }

        const supabase = getSupabaseAdmin();

        // Fetch PDF history
        const { data: pdfHistory } = await supabase
            .from("pdf_history")
            .select("id, job_title, company_name, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);

        // Fetch support tickets
        const { data: tickets } = await supabase
            .from("support_tickets")
            .select("id, subject, status, created_at, admin_response")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

        return NextResponse.json({
            pdfHistory: pdfHistory || [],
            tickets: tickets || [],
        });

    } catch (error) {
        console.error("User data fetch error:", error);
        return NextResponse.json({ pdfHistory: [], tickets: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, subject, message } = body;

        if (!email || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Create support ticket
        const { data: ticket, error } = await supabase
            .from("support_tickets")
            .insert({
                user_id: userId || null,
                email,
                subject,
                message,
                status: "open",
            })
            .select()
            .single();

        if (error) {
            console.error("Ticket creation error:", error);
            return NextResponse.json(
                { error: "Failed to create ticket" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, ticketId: ticket?.id });

    } catch (error) {
        console.error("Support ticket error:", error);
        return NextResponse.json(
            { error: "Failed to create ticket" },
            { status: 500 }
        );
    }
}
