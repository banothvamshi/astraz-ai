import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

// Browser client for client-side auth using cookies (SSR-compatible)
export function getSupabaseBrowserClient() {
    // This now uses @supabase/ssr's createBrowserClient which stores session in cookies
    // This is critical for Next.js App Router where Server Components need to read auth state
    return createClient();
}

// Admin client for server-side operations
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // Security Check: Ensure we aren't using the 'anon' key by mistake
    if (supabaseServiceKey && supabaseServiceKey.includes('.')) {
        try {
            const payload = JSON.parse(atob(supabaseServiceKey.split('.')[1]));
            if (payload.role !== 'service_role') {
                console.error("\n\n❌ CRITICAL SECURITY WARNING: ❌");
                console.error("The 'SUPABASE_SERVICE_ROLE_KEY' appears to be an 'anon' key (role: " + payload.role + ").");
                console.error("Admin actions (upgrades, credits) WILL FAIL.");
                console.error("Please update your environment variables with the 'service_role' (secret) key from Supabase Dashboard.\n\n");
            }
        } catch (e) {
            // Ignore parsing errors, let Supabase handle valid/invalid keys
        }
    }

    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Generate a secure random password
export function generateSecurePassword(length: number = 12): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const all = lowercase + uppercase + numbers + special;

    let password = "";
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password.split("").sort(() => Math.random() - 0.5).join("");
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain a lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain an uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain a number");
    }

    return { valid: errors.length === 0, errors };
}

// Sanitize email input
export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

// Check if first login (needs password reset)
export async function isFirstLogin(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
        .from("profiles")
        .select("first_login_completed")
        .eq("id", userId)
        .single();

    return !(data?.first_login_completed);
}

// Mark first login as completed
export async function markFirstLoginCompleted(userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase
        .from("profiles")
        .update({ first_login_completed: true, updated_at: new Date().toISOString() })
        .eq("id", userId);
}
