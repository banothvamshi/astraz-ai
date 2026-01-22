"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    BarChart3,
    Settings,
    Activity,
    LogOut,
    Tag,
    Globe,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface AdminSidebarProps {
    className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
    const pathname = usePathname();

    const links = [
        { href: "/admin", label: "Command Center", icon: LayoutDashboard, description: "Overview & KPIs" },
        { href: "/admin/users", label: "User Intelligence", icon: Users, description: "Manage accounts" },
        { href: "/admin/payments", label: "Revenue Stream", icon: CreditCard, description: "Track finances" },
        { href: "/admin/analytics", label: "Analytics Hub", icon: BarChart3, description: "Traffic & conversions" },
        { href: "/admin/coupons", label: "Promo Engine", icon: Tag, description: "Discount codes" },
        { href: "/admin/system", label: "System Health", icon: Activity, description: "Server status" },
        { href: "/admin/settings", label: "Configuration", icon: Settings, description: "Global settings" },
    ];

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Logo Header */}
            <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-white">Super Admin</span>
                        <p className="text-xs text-white/70">Astraz AI Control</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                isActive
                                    ? "bg-white/20"
                                    : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate">{link.label}</p>
                                {!isActive && (
                                    <p className="text-xs text-slate-400 truncate">{link.description}</p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* System Status Indicator */}
            <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">All Systems Operational</span>
                </div>
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
