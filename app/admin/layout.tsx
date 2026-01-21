"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
    CreditCard,
    FileText,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Check for admin access
    useEffect(() => {
        const checkAdmin = async () => {
            const supabase = getSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .single();

            if (!profile?.is_admin) {
                router.push("/dashboard"); // Not an admin
            } else {
                setIsLoading(false);
            }
        };

        checkAdmin();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/admin" },
        { icon: Users, label: "Users", href: "/admin/users" },
        { icon: Activity, label: "Analytics", href: "/admin/analytics" },
        { icon: Settings, label: "Settings", href: "/admin/settings" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:relative lg:translate-x-0 outline-none shadow-2xl shadow-slate-900/50`}
            >
                <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 font-bold text-xl">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Admin Panel</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-6 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${isActive
                                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-8 left-6 right-6">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 h-12 rounded-xl"
                        onClick={async () => {
                            const supabase = getSupabaseBrowserClient();
                            await supabase.auth.signOut();
                            // Clear admin cookie
                            document.cookie = "astraz_admin_key=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
                            router.push("/login");
                        }}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-40 sticky top-0">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50">
                            Super Admin Access
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 font-bold shadow-sm dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400">
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
