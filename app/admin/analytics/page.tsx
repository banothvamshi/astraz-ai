"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Users, CreditCard, FileText, DollarSign, Calendar } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth";

interface AnalyticsData {
    totalRevenue: number;
    totalUsers: number;
    totalGenerations: number;
    paidUsers: number;
    conversionRate: number;
    revenueByMonth: { month: string; revenue: number }[];
    usersByMonth: { month: string; users: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();

        // Calculate date filter
        const now = new Date();
        let startDate = new Date();
        if (dateRange === "7d") startDate.setDate(now.getDate() - 7);
        else if (dateRange === "30d") startDate.setDate(now.getDate() - 30);
        else if (dateRange === "90d") startDate.setDate(now.getDate() - 90);
        else startDate = new Date(0);

        // Fetch all data
        const [profilesRes, paymentsRes, generationsRes] = await Promise.all([
            supabase.from("profiles").select("id, is_premium, created_at"),
            supabase.from("payments").select("amount, plan_type, created_at").eq("status", "completed"),
            supabase.from("generations").select("id, created_at")
        ]);

        const profiles = profilesRes.data || [];
        const payments = paymentsRes.data || [];
        const generations = generationsRes.data || [];

        // Calculate metrics
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
        const totalUsers = profiles.length;
        const paidUsers = profiles.filter(p => p.is_premium).length;
        const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;
        const totalGenerations = generations.length;

        // Group by month for charts
        const getMonthKey = (date: string) => {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const revenueByMonthMap: Record<string, number> = {};
        const usersByMonthMap: Record<string, number> = {};

        payments.forEach(p => {
            const key = getMonthKey(p.created_at);
            revenueByMonthMap[key] = (revenueByMonthMap[key] || 0) + (p.amount || 0) / 100;
        });

        profiles.forEach(p => {
            const key = getMonthKey(p.created_at);
            usersByMonthMap[key] = (usersByMonthMap[key] || 0) + 1;
        });

        // Convert to arrays and sort
        const revenueByMonth = Object.entries(revenueByMonthMap)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        const usersByMonth = Object.entries(usersByMonthMap)
            .map(([month, users]) => ({ month, users }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        setData({
            totalRevenue,
            totalUsers,
            totalGenerations,
            paidUsers,
            conversionRate,
            revenueByMonth,
            usersByMonth
        });
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
                    <p className="text-slate-500">Track revenue, users, and conversions</p>
                </div>
                <div className="flex items-center gap-2">
                    {(["7d", "30d", "90d", "all"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                    ? "bg-amber-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            {range === "all" ? "All Time" : range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${data?.totalRevenue.toLocaleString() || 0}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    color="emerald"
                />
                <StatCard
                    title="Total Users"
                    value={data?.totalUsers || 0}
                    icon={<Users className="h-5 w-5" />}
                    color="blue"
                />
                <StatCard
                    title="Paid Users"
                    value={data?.paidUsers || 0}
                    icon={<CreditCard className="h-5 w-5" />}
                    color="amber"
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${data?.conversionRate.toFixed(1) || 0}%`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="purple"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Revenue by Month</h3>
                    <div className="space-y-3">
                        {(data?.revenueByMonth || []).map((item) => (
                            <div key={item.month} className="flex items-center gap-4">
                                <span className="text-sm text-slate-500 w-20">{item.month}</span>
                                <div className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full flex items-center justify-end pr-2"
                                        style={{
                                            width: `${Math.min(100, (item.revenue / Math.max(...(data?.revenueByMonth || []).map(r => r.revenue), 1)) * 100)}%`
                                        }}
                                    >
                                        <span className="text-xs text-white font-medium">₹{item.revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data?.revenueByMonth || data.revenueByMonth.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-8">No revenue data yet</p>
                        )}
                    </div>
                </div>

                {/* Users Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">User Signups by Month</h3>
                    <div className="space-y-3">
                        {(data?.usersByMonth || []).map((item) => (
                            <div key={item.month} className="flex items-center gap-4">
                                <span className="text-sm text-slate-500 w-20">{item.month}</span>
                                <div className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                                        style={{
                                            width: `${Math.min(100, (item.users / Math.max(...(data?.usersByMonth || []).map(u => u.users), 1)) * 100)}%`
                                        }}
                                    >
                                        <span className="text-xs text-white font-medium">{item.users}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data?.usersByMonth || data.usersByMonth.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-8">No signup data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Generations Stat */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Resume Generations</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.totalGenerations.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: "emerald" | "blue" | "amber" | "purple" }) {
    const colorClasses = {
        emerald: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
        blue: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
        amber: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
        purple: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}
