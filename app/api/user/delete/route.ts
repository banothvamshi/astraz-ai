import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
    try {
        // 1. Verify User Identity
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false } }
        );

        const token = request.cookies.get('sb-access-token')?.value ||
            request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}-auth-token`)?.value;

        // If simple cookie check fails, we might rely on the client passing the token, but for now strict cookie check
        // Or we could try `auth.getUser()` passing the JWT from the header if the client sends it.
        // Let's assume standard Supabase cookie auth for simplicity in this rescue.

        let userId = null;
        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use Admin Client to delete user from Auth (requires service_role)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete from public tables first (though cascade might handle it, better to be explicit or rely on cascade)
        // Assuming Database has ON DELETE CASCADE on foreign keys
        // If not, we'd delete from tables manually:
        // await supabaseAdmin.from("generations").delete().eq("user_id", userId);
        // await supabaseAdmin.from("profiles").delete().eq("id", userId);

        // Delete User from Auth System (this triggers everything else if set up correctly)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Auth delete error:", deleteError);
            throw deleteError;
        }

        return NextResponse.json({ success: true, message: "Account deleted permanently" });

    } catch (error: any) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
