import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { formatAdminDate, getISTDate } from "@/lib/date-utils";
import {
    Users,
    CreditCard,
    Activity,
    TrendingUp,
    BarChart3,
    Tag,
    Settings,
    ArrowUpRight,
    Sparkles,
    Globe,
    Clock,
    Eye
} from "lucide-react";

export default async function AdminDashboard() {
    const supabase = await createClient();

    // 1. Fetch Key Metrics
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at")
        .eq("status", "captured")
        .order("created_at", { ascending: false });

    const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount / 100), 0) || 0;

    // Total Users
    const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    // Active Premium Users
    const { count: premiumCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_premium", true);

    // Recent Generations (Last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: generationCount } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo);

    // Live Visitors (Last 15 mins)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    // Safety check: analytics_visits might not exist yet if user hasn't run SQL
    // We'll wrap in try/catch or just be optimistic. Using 'try/catch' pattern in async not easy here inside component body
    // unless we use a helper. But Supabase just returns error if table missing.
    const { count: liveVisitors, error: visitorsError } = await supabase
        .from("analytics_visits")
        .select("*", { count: "exact", head: true })
        .gte("created_at", fifteenMinsAgo);

    // Total Visits (24h)
    const { count: visits24h } = await supabase
        .from("analytics_visits")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo);

    // Total Generations (All Time)
    const { count: totalGenerations } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true });

    // Anonymous Generations
    const { count: anonymousGenerations } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .is("user_id", null);

    // Recent Users (for activity feed)
    const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, email, created_at, is_premium")
        .order("created_at", { ascending: false })
        .limit(5);

    const cards = [
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            change: "+12.5%",
            icon: CreditCard,
            color: "from-emerald-500 to-teal-600",
            href: "/admin/payments"
        },
        {
            title: "Live Visitors",
            value: liveVisitors?.toLocaleString() || "0",
            change: `${visits24h || 0} in 24h`,
            icon: Eye,
            color: "from-blue-500 to-cyan-500",
            href: "/admin/analytics"
        },
        {
            title: "24h Generations",
            value: generationCount?.toLocaleString() || "0",
            change: `${totalGenerations} Total`,
            icon: Activity,
            color: "from-amber-500 to-orange-600",
            href: "/admin/analytics"
        },
        {
            title: "Conversion Rate",
            value: userCount ? ((premiumCount || 0) / userCount * 100).toFixed(1) + "%" : "0%",
            change: `${userCount} Users`,
            icon: TrendingUp,
            color: "from-purple-500 to-pink-600",
            href: "/admin/analytics"
        },
    ];

    const quickActions = [
        { label: "View All Users", href: "/admin/users", icon: Users },
        { label: "Analytics Hub", href: "/admin/analytics", icon: BarChart3 },
        { label: "Manage Coupons", href: "/admin/coupons", icon: Tag },
        { label: "System Health", href: "/admin/system", icon: Activity },
        { label: "Settings", href: "/admin/settings", icon: Settings },
    ];

    // Current IST Time
    const istTime = formatAdminDate(getISTDate(), "p"); // e.g. "6:45 PM"

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Command Center</h1>
                    <p className="text-slate-500 mt-1">Real-time platform overview and controls</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <Clock className="h-4 w-4" />
                    <span>IST: {istTime}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="group relative p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                                <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full inline-block">
                                    {card.change}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Quick Actions
                    </h3>
                    <div className="space-y-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
                                    <ArrowUpRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-slate-500" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Signups */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        Recent Signups
                    </h3>
                    <div className="space-y-3">
                        {(recentUsers || []).map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-2">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                                    <p className="text-xs text-slate-500">{formatAdminDate(user.created_at, "PP")}</p>
                                </div>
                                {user.is_premium && (
                                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">PRO</span>
                                )}
                            </div>
                        ))}
                        {(!recentUsers || recentUsers.length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-4">No recent signups</p>
                        )}
                    </div>
                </div>

                {/* Anonymous vs Registered */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-emerald-500" />
                        User Distribution
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Registered Users</span>
                                <span className="text-2xl font-bold text-blue-600">{userCount || 0}</span>
                            </div>
                            <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${totalGenerations ? ((totalGenerations - (anonymousGenerations || 0)) / totalGenerations * 100) : 0}%` }}
                                />
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anonymous Generations</span>
                                <span className="text-2xl font-bold text-slate-600">{anonymousGenerations || 0}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Users who tried without signing up</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-500" />
                        Recent Payments
                    </h3>
                    <Link href="/admin/payments" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        View All <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {(payments || []).slice(0, 4).map((payment: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">₹{(payment.amount / 100).toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">{formatAdminDate(payment.created_at)}</p>
                        </div>
                    ))}
                    {(!payments || payments.length === 0) && (
                        <p className="col-span-full text-sm text-slate-500 text-center py-8">No recent payments</p>
                    )}
                </div>
            </div>
        </div>
    );
}
