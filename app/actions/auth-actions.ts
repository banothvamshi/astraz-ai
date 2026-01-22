"use server";

import { getSupabaseAdmin } from "@/lib/auth";

export async function sendResetPasswordEmail(email: string) {
    const supabase = getSupabaseAdmin();
    const emailLower = email.toLowerCase().trim();

    try {
        // 1. Check if user exists. 
        // We check both 'profiles' and 'users' tables to be safe, as schemas might be transitioning.
        // Ideally, every user in auth should have an entry in one of these.

        // Check profiles
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", emailLower)
            .maybeSingle();

        let userExists = !!profile;

        // Check users if not found in profiles
        if (!userExists) {
            const { data: user, error: userError } = await supabase
                .from("users")
                .select("id")
                .eq("email", emailLower)
                .maybeSingle();
            userExists = !!user;
        }

        if (!userExists) {
            // User explicitly requested to restrict to existing users.
            return { success: false, message: "No account found with this email address." };
        }

        // 2. Send reset email
        // Use NEXT_PUBLIC_APP_URL or fall back to localhost for dev
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const { error } = await supabase.auth.resetPasswordForEmail(emailLower, {
            redirectTo: `${appUrl}/reset-password`,
        });

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("Reset password error:", err);
        return { success: false, message: "An unexpected error occurred." };
    }
}
