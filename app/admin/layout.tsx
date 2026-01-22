import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    // Check Admin Role
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

    if (!profile || !profile.is_admin) {
        redirect("/dashboard"); // Kick non-admins back to dashboard
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            <AdminSidebar className="w-64 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
            <div className="flex-1 flex flex-col min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
