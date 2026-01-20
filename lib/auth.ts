import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Singleton instance for browser client
let browserClient: SupabaseClient | null = null;

// Browser client for client-side auth (Singleton)
export function getSupabaseBrowserClient() {
    if (browserClient) {
        return browserClient;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
    return browserClient;
}

// Admin client for server-side operations
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    return createClient(supabaseUrl, supabaseServiceKey, {
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
