"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Users, CreditCard, FileText, DollarSign, Calendar, Globe, Eye, UserPlus, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth";

interface AnalyticsData {
    totalRevenue: number;
    totalUsers: number;
    totalGenerations: number;
    paidUsers: number;
    conversionRate: number;
    anonymousGenerations: number;
    avgRevenuePerUser: number;
    revenueByMonth: { month: string; revenue: number }[];
    usersByMonth: { month: string; users: number }[];
    generationsByDay: { day: string; count: number }[];
    topCountries: { country: string; count: number }[];
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

        // Fetch all data
        const [profilesRes, paymentsRes, generationsRes] = await Promise.all([
            supabase.from("profiles").select("id, is_premium, created_at, country"),
            supabase.from("payments").select("amount, plan_type, created_at").eq("status", "captured"),
            supabase.from("generations").select("id, user_id, created_at")
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
        const anonymousGenerations = generations.filter(g => !g.user_id).length;
        const avgRevenuePerUser = paidUsers > 0 ? totalRevenue / paidUsers : 0;

        // Group by month for charts
        const getMonthKey = (date: string) => {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const getDayKey = (date: string) => {
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        };

        const revenueByMonthMap: Record<string, number> = {};
        const usersByMonthMap: Record<string, number> = {};
        const generationsByDayMap: Record<string, number> = {};
        const countriesMap: Record<string, number> = {};

        payments.forEach(p => {
            const key = getMonthKey(p.created_at);
            revenueByMonthMap[key] = (revenueByMonthMap[key] || 0) + (p.amount || 0) / 100;
        });

        profiles.forEach(p => {
            const key = getMonthKey(p.created_at);
            usersByMonthMap[key] = (usersByMonthMap[key] || 0) + 1;
            if (p.country) {
                countriesMap[p.country] = (countriesMap[p.country] || 0) + 1;
            }
        });

        // Last 7 days generations
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        generations.filter(g => new Date(g.created_at) >= sevenDaysAgo).forEach(g => {
            const key = getDayKey(g.created_at);
            generationsByDayMap[key] = (generationsByDayMap[key] || 0) + 1;
        });

        // Convert to arrays
        const revenueByMonth = Object.entries(revenueByMonthMap)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        const usersByMonth = Object.entries(usersByMonthMap)
            .map(([month, users]) => ({ month, users }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        const generationsByDay = Object.entries(generationsByDayMap)
            .map(([day, count]) => ({ day, count }))
            .sort((a, b) => a.day.localeCompare(b.day));

        const topCountries = Object.entries(countriesMap)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setData({
            totalRevenue,
            totalUsers,
            totalGenerations,
            paidUsers,
            conversionRate,
            anonymousGenerations,
            avgRevenuePerUser,
            revenueByMonth,
            usersByMonth,
            generationsByDay,
            topCountries
        });
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const kpiCards = [
        { title: "Total Revenue", value: `₹${data?.totalRevenue.toLocaleString() || 0}`, icon: DollarSign, color: "emerald", change: "+12.5%" },
        { title: "Total Users", value: data?.totalUsers || 0, icon: Users, color: "blue", change: "+8.2%" },
        { title: "Paid Users", value: data?.paidUsers || 0, icon: CreditCard, color: "amber", change: "+15.3%" },
        { title: "Conversion Rate", value: `${data?.conversionRate.toFixed(1) || 0}%`, icon: TrendingUp, color: "purple", change: "+2.1%" },
        { title: "Total Generations", value: data?.totalGenerations.toLocaleString() || 0, icon: FileText, color: "indigo", change: "+24.7%" },
        { title: "Anonymous Users", value: data?.anonymousGenerations || 0, icon: Globe, color: "slate", change: "Trial Users" },
        { title: "Avg. Revenue/User", value: `₹${data?.avgRevenuePerUser.toFixed(0) || 0}`, icon: Activity, color: "rose", change: "ARPU" },
        { title: "Registered Gens", value: (data?.totalGenerations || 0) - (data?.anonymousGenerations || 0), icon: UserPlus, color: "cyan", change: "Logged In" },
    ];

    const colorMap: Record<string, string> = {
        emerald: "from-emerald-500 to-teal-600",
        blue: "from-blue-500 to-indigo-600",
        amber: "from-amber-500 to-orange-600",
        purple: "from-purple-500 to-pink-600",
        indigo: "from-indigo-500 to-violet-600",
        slate: "from-slate-500 to-gray-600",
        rose: "from-rose-500 to-red-600",
        cyan: "from-cyan-500 to-blue-600",
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics Hub</h1>
                    <p className="text-slate-500 mt-1">Deep insights into platform performance</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(["7d", "30d", "90d", "all"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === range
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            {range === "all" ? "All Time" : range}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[card.color]} text-white`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-slate-500">{card.title}</p>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    {card.change}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        Revenue Trend
                    </h3>
                    <div className="space-y-4">
                        {(data?.revenueByMonth || []).map((item) => {
                            const maxRevenue = Math.max(...(data?.revenueByMonth || []).map(r => r.revenue), 1);
                            return (
                                <div key={item.month} className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500 w-20 font-medium">{item.month}</span>
                                    <div className="flex-grow relative h-8">
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-end pr-3"
                                            style={{ width: `${Math.min(100, (item.revenue / maxRevenue) * 100)}%` }}
                                        >
                                            <span className="text-xs text-white font-bold">₹{item.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!data?.revenueByMonth || data.revenueByMonth.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-8">No revenue data yet</p>
                        )}
                    </div>
                </div>

                {/* Users Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-500" />
                        User Growth
                    </h3>
                    <div className="space-y-4">
                        {(data?.usersByMonth || []).map((item) => {
                            const maxUsers = Math.max(...(data?.usersByMonth || []).map(u => u.users), 1);
                            return (
                                <div key={item.month} className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500 w-20 font-medium">{item.month}</span>
                                    <div className="flex-grow relative h-8">
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-end pr-3"
                                            style={{ width: `${Math.min(100, (item.users / maxUsers) * 100)}%` }}
                                        >
                                            <span className="text-xs text-white font-bold">{item.users}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!data?.usersByMonth || data.usersByMonth.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-8">No signup data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* User Breakdown */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Anonymous vs Registered */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-500" />
                        User Type Distribution
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500 text-white">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{(data?.totalGenerations || 0) - (data?.anonymousGenerations || 0)}</p>
                                    <p className="text-sm text-blue-600/70">Registered User Generations</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-slate-500 text-white">
                                    <Eye className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">{data?.anonymousGenerations || 0}</p>
                                    <p className="text-sm text-slate-500">Anonymous/Trial Generations</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Countries */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-emerald-500" />
                        Top Locations
                    </h3>
                    <div className="space-y-3">
                        {(data?.topCountries || []).length > 0 ? (
                            data?.topCountries.map((item, i) => (
                                <div key={item.country} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.country}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.count}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No location data</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
