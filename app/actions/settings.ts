"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface SystemSettings {
    id: number;
    free_trial_credits: number;
    max_daily_generations: number;
    maintenance_mode: boolean;
    registration_enabled: boolean;
    default_plan: string;
    email_notifications: boolean;
}

export async function getSystemSettings(): Promise<SystemSettings> {
    const supabase = await createClient();

    // Public/Auth read enabled, but let's just fetch directly
    const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", 1) // Singleton row
        .single();

    if (error || !data) {
        // Fallback or init default (though SQL script should handle this)
        console.error("Failed to fetch settings:", error);
        return {
            id: 1,
            free_trial_credits: 1,
            max_daily_generations: 50,
            maintenance_mode: false,
            registration_enabled: true,
            default_plan: "free",
            email_notifications: true
        };
    }

    return data as SystemSettings;
}

export async function updateSystemSettings(settings: Partial<SystemSettings>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Strict Admin Check
    // We can rely on RLS but explicit check is safer for server actions
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_admin) {
        return { error: "Access Denied: Admin only" };
    }

    const { error } = await supabase
        .from("system_settings")
        .update({
            free_trial_credits: settings.free_trial_credits,
            max_daily_generations: settings.max_daily_generations,
            maintenance_mode: settings.maintenance_mode,
            registration_enabled: settings.registration_enabled,
            default_plan: settings.default_plan,
            email_notifications: settings.email_notifications,
            updated_at: new Date().toISOString()
        })
        .eq("id", 1); // Always update Singleton

    if (error) {
        console.error("Settings update error:", error);
        return { error: "Failed to save settings" };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin"); // Dashboard might rely on this too
    return { success: true };
}
