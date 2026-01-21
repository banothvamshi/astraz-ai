"use client";

import { useEffect, useState } from "react";
import {
    Users,
    CreditCard,
    FileText,
    TrendingUp,
    DollarSign,
    Zap,
    Activity
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth";

interface Stats {
    totalUsers: number;
    totalRevenue: number;
    totalGenerations: number;
    activeUsers: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalRevenue: 0,
        totalGenerations: 0,
        activeUsers: 0
    });

    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = getSupabaseBrowserClient();

            // Fetch total users
            const { count: userCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });

            // Fetch recent users
            const { data: users } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(5);

            // Fetch payments for revenue
            const { data: payments } = await supabase
                .from("payments")
                .select("amount")
                .eq("status", "completed");

            const revenue = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

            // Fetch generations (sum of totals)
            const { data: profiles } = await supabase
                .from("profiles")
                .select("total_generations");

            const generations = profiles?.reduce((acc, curr) => acc + (curr.total_generations || 0), 0) || 0;

            setStats({
                totalUsers: userCount || 0,
                totalRevenue: revenue,
                totalGenerations: generations,
                activeUsers: Math.floor((userCount || 0) * 0.8) // Mock for demo
            });

            if (users) setRecentUsers(users);
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            label: "Total Users",
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            color: "blue",
            gradient: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            trend: "+12% this month"
        },
        {
            label: "Total Revenue",
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "emerald",
            gradient: "from-emerald-500 to-teal-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            trend: "+8% this month"
        },
        {
            label: "Total Generations",
            value: stats.totalGenerations.toLocaleString(),
            icon: FileText,
            color: "amber",
            gradient: "from-amber-500 to-orange-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            trend: "+24% this month"
        },
        {
            label: "Active Users",
            value: stats.activeUsers.toLocaleString(),
            icon: Activity,
            color: "purple",
            gradient: "from-purple-500 to-violet-600",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            trend: "+5% this month"
        }
    ];

    return (
        <div className="space-y-8 p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 transition-transform hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`rounded-xl p-3 bg-gradient-to-br ${stat.gradient} shadow-lg shadow-${stat.color}-500/20`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Users Table */}
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Users</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {recentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 font-bold dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400">
                                                {user.full_name?.[0] || "U"}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">{user.full_name}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {user.is_admin ? "Admin" : "User"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
