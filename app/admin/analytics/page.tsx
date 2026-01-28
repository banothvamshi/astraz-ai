"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Users, CreditCard, FileText, DollarSign, Calendar, Globe, Eye, UserPlus, Activity, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth";
import { formatAdminDate, getISTDate } from "@/lib/date-utils";

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
    visitsByDay: { day: string; count: number; unique: number }[];
    topCountries: { country: string; count: number }[];
    topIPs: { ip: string; count: number }[];
    errorRate: number;
    recentErrors: { action: string; message: string; date: string }[];
    dailyActiveUsers: { day: string; count: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 60000); // Poll every 60 seconds for near real-time updates
        return () => clearInterval(interval);
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();

        // Fetch all data
        const [profilesRes, paymentsRes, generationsRes, visitsRes] = await Promise.all([
            supabase.from("profiles").select("id, is_premium, created_at, country"),
            supabase.from("payments").select("amount, plan_type, created_at").eq("status", "captured"),
            supabase.from("generations").select("id, user_id, created_at, ip_address"),
            supabase.from("analytics_visits").select("visitor_id, created_at, ip_address")
        ]);

        const profiles = profilesRes.data || [];
        const payments = paymentsRes.data || [];
        const generations = generationsRes.data || [];
        const visits = visitsRes.data || [];

        // Calculate metrics
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
        const totalUsers = profiles.length;
        const paidUsers = profiles.filter(p => p.is_premium).length;
        const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;
        const totalGenerations = generations.length;
        const anonymousGenerations = generations.filter(g => !g.user_id).length;
        const avgRevenuePerUser = paidUsers > 0 ? totalRevenue / paidUsers : 0;

        // Group by month for charts (using IST)
        const getMonthKey = (date: string) => {
            // Admin View: Use IST Month
            // formatAdminDate returns "August 24, 2026..." or similar. 
            // We need "2026-08" for sorting.
            // Let's use date-fns format with timezone helper in utils, but here strictly:
            // We'll trust formatAdminDate with custom format if needed, or just manual mapping for now.
            // Simpler: Use substring of ISO is WRONG for IST. 
            // Let's rely on date string manipulation for simplicity or better use helper.
            return formatAdminDate(date, 'yyyy-MM');
        };

        const getDayKey = (date: string) => {
            return formatAdminDate(date, 'yyyy-MM-dd');
        };

        const revenueByMonthMap: Record<string, number> = {};
        const usersByMonthMap: Record<string, number> = {};
        const generationsByDayMap: Record<string, number> = {};
        const visitsByDayMap: Record<string, number> = {};
        const uniqueVisitsByDayMap: Record<string, Set<string>> = {};
        const countriesMap: Record<string, number> = {};

        // Top IPs Logic
        const ipCounts: Record<string, number> = {};
        generations.forEach(g => {
            if (g.ip_address) {
                ipCounts[g.ip_address] = (ipCounts[g.ip_address] || 0) + 1;
            }
        });

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

        // Last 7 days generations & visits
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Filter locally (imperfect but works for dashboard size data)
        generations.forEach(g => {
            // We want all days for the chart, typically last 7 or 30
            // Let's just track all and slice later
            const key = getDayKey(g.created_at);
            generationsByDayMap[key] = (generationsByDayMap[key] || 0) + 1;
        });

        visits.forEach(v => {
            const key = getDayKey(v.created_at);
            visitsByDayMap[key] = (visitsByDayMap[key] || 0) + 1;

            if (!uniqueVisitsByDayMap[key]) uniqueVisitsByDayMap[key] = new Set();
            uniqueVisitsByDayMap[key].add(v.visitor_id);
        });


        // Convert to arrays and Sort
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
            .sort((a, b) => a.day.localeCompare(b.day))
            .slice(-30); // Last 30 days

        const visitsByDay = Object.entries(visitsByDayMap)
            .map(([day, count]) => ({
                day,
                count,
                unique: uniqueVisitsByDayMap[day]?.size || 0
            }))
            .sort((a, b) => a.day.localeCompare(b.day))
            .slice(-30);

        const topCountries = Object.entries(countriesMap)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topIPs = Object.entries(ipCounts)
            .map(([ip, count]) => ({ ip, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Fetch Error Logs & DAU from activity_log
        const { data: activityLogs } = await supabase
            .from('activity_log')
            .select('action, metadata, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(1000);

        const errors = (activityLogs || []).filter(l => l.action.includes('error'));
        const errorRate = (activityLogs || []).length > 0 ? (errors.length / (activityLogs || []).length) * 100 : 0;

        const recentErrors = errors.slice(0, 5).map(e => ({
            action: e.action,
            message: (e.metadata as any)?.error || 'Unknown error',
            date: formatAdminDate(e.created_at)
        }));

        // Calculate DAU from activity_log (Generic DAU)
        const dauMap: Record<string, Set<string>> = {};
        (activityLogs || []).forEach(log => {
            if (log.user_id) {
                const day = getDayKey(log.created_at);
                if (!dauMap[day]) dauMap[day] = new Set();
                dauMap[day].add(log.user_id);
            }
        });

        const dailyActiveUsers = Object.entries(dauMap)
            .map(([day, usersSet]) => ({ day, count: usersSet.size }))
            .sort((a, b) => a.day.localeCompare(b.day));

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
            topCountries,
            errorRate,
            recentErrors,
            dailyActiveUsers,
            visitsByDay,
            topIPs // Add to interface
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
        { title: "Avg. Revenue/User", value: `₹${data?.avgRevenuePerUser.toFixed(0) || 0}`, icon: Activity, color: "rose", change: "ARPU" },
        { title: "Registered Gens", value: (data?.totalGenerations || 0) - (data?.anonymousGenerations || 0), icon: UserPlus, color: "cyan", change: "Logged In" },
        { title: "Error Rate", value: `${data?.errorRate.toFixed(1) || 0}%`, icon: AlertTriangle, color: "red", change: "Last 1000 ops" },
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

            {/* Traffic Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Visits Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-cyan-500" />
                        Traffic Trend (Visits vs Unique)
                    </h3>
                    <div className="space-y-4">
                        {(data?.visitsByDay || []).map((item) => {
                            const maxVisits = Math.max(...(data?.visitsByDay || []).map(v => v.count), 1);
                            return (
                                <div key={item.day} className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500 w-24 font-medium">{item.day.slice(5)}</span>
                                    <div className="flex-grow relative h-8">
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                                        {/* Total Visits */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-cyan-200 dark:bg-cyan-900/50 rounded-lg"
                                            style={{ width: `${Math.min(100, (item.count / maxVisits) * 100)}%` }}
                                        />
                                        {/* Unique */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-cyan-500 rounded-lg flex items-center justify-end pr-3"
                                            style={{ width: `${Math.min(100, (item.unique / maxVisits) * 100)}%` }}
                                        >
                                            <span className="text-xs text-white font-bold">{item.unique} / {item.count}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!data?.visitsByDay || data.visitsByDay.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-8">No traffic data yet</p>
                        )}
                    </div>
                </div>

                {/* Top IPs Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        Top Generating IPs
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">IP Address</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Generations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.topIPs || []).map((ipItem, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 font-mono">
                                            {ipItem.ip.replace(ipItem.ip.substring(ipItem.ip.lastIndexOf('.')), '.*')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                            {ipItem.count}
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.topIPs || data.topIPs.length === 0) && (
                                    <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">No IP data logs</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Charts Grid - Existing */}
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

            {/* Error Logs Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Recent System Errors
                </h3>
                <div className="space-y-3">
                    {(data?.recentErrors || []).length > 0 ? (
                        (data?.recentErrors || []).map((err, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                <div>
                                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 capitalize">{err.action.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-red-600/70 dark:text-red-400/70 truncate max-w-md">{err.message}</p>
                                </div>
                                <span className="text-xs text-slate-500">{new Date(err.date).toLocaleTimeString()}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No recent errors detected</p>
                    )}
                </div>
            </div>
        </div>
    );
}
