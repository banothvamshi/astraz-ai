"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function trackVisit(path: string) {
    try {
        const supabase = await createClient();
        const headersList = await headers();

        // Get IP
        const forwardedFor = headersList.get("x-forwarded-for");
        const realIp = headersList.get("x-real-ip");
        const ip = forwardedFor?.split(",")[0] || realIp || "unknown";

        // Get User Agent
        const userAgent = headersList.get("user-agent") || "unknown";

        // Simple Hash for "Visitor ID" (IP + partial UA)
        // In a real app, use a proper hashing lib, but simple string concat is fine for basic semi-anon differentiation
        const visitorId = Buffer.from(`${ip}-${userAgent}`).toString('base64');

        // Get Logged In User
        const { data: { user } } = await supabase.auth.getUser();

        // Insert Visit
        await supabase.from("analytics_visits").insert({
            visitor_id: visitorId,
            user_id: user?.id || null,
            path: path,
            ip_address: ip, // Storing raw IP as requested for "Same IP" detection
            user_agent: userAgent,
        });

    } catch (error) {
        console.error("Tracking Error:", error);
        // Silent fail - don't block UI
    }
}
