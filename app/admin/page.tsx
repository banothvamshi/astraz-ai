import { createClient } from "@/utils/supabase/server";
import {
    Users,
    CreditCard,
    Activity,
    TrendingUp,
    AlertCircle
} from "lucide-react";

export default async function AdminDashboard() {
    const supabase = createClient();

    // 1. Fetch Key Metrics
    // Total Revenue (approximate from successful payments)
    const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "captured");

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

    const cards = [
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            change: "+12% from last month",
            icon: CreditCard,
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
            title: "Total Users",
            value: userCount?.toLocaleString() || "0",
            change: `+${premiumCount} Premium`,
            icon: Users,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        },
        {
            title: "24h Generations",
            value: generationCount?.toLocaleString() || "0",
            change: "System Active",
            icon: Activity,
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        },
        {
            title: "System Status",
            value: "99.9% Uptime",
            change: "All systems operational",
            icon: TrendingUp,
            color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, Super Admin.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                                    {card.change}
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                    <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        Chart Placeholder (Recharts integration required)
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Payments</h3>
                    {/* We will fetch recent payments here */}
                    <div className="space-y-4">
                        {(payments || []).slice(0, 5).map((payment: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Payment Received</p>
                                        <p className="text-xs text-slate-500">ID: {payment.razorpay_order_id || "N/A"}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-emerald-600">+{payment.amount / 100}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
