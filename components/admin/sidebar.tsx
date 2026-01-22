"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    FileText,
    Settings,
    Shield,
    Activity,
    LogOut,
    Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

interface AdminSidebarProps {
    className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
    const pathname = usePathname();

    const links = [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/features", label: "Feature Flags", icon: Settings },
        { href: "/admin/support", label: "Support Tickets", icon: Ticket },
        { href: "/admin/audit", label: "Audit Logs", icon: Shield },
        { href: "/admin/status", label: "System Health", icon: Activity },
    ];

    const handleLogout = async () => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
                    <Shield className="h-6 w-6 text-indigo-600" />
                    <span>Super Admin</span>
                </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
