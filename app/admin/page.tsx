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
            trend: "+12% this month"
        },
        {
            label: "Total Revenue",
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "emerald",
            trend: "+8% this month"
        },
        {
            label: "Total Generations",
            value: stats.totalGenerations.toLocaleString(),
            icon: FileText,
            color: "amber",
            trend: "+24% this month"
        },
        {
            label: "Active Users",
            value: stats.activeUsers.toLocaleString(),
            icon: Activity,
            color: "purple",
            trend: "Consistent"
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-slate-500 mt-2">Welcome back to your master control panel.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Registrations</h2>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {recentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                {user.email?.substring(0, 2)}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{user.full_name || 'User'}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_premium ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {user.is_premium ? 'Premium' : 'Free'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
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
