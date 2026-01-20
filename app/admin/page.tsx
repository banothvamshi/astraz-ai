"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    CreditCard,
    FileText,
    MessageSquare,
    ArrowLeft,
    RefreshCw,
    Search,
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
    totalUsers: number;
    paidUsers: number;
    freeUsers: number;
    totalGenerations: number;
    totalRevenue: number;
    openTickets: number;
}

interface UserRecord {
    id: string;
    email: string;
    created_at: string;
    is_premium: boolean;
    generations_count: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "support">("overview");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/stats");
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Admin Dashboard
                        </h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="mb-8 flex gap-2">
                    {["overview", "users", "support"].map((tab) => (
                        <Button
                            key={tab}
                            variant={activeTab === tab ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className="capitalize"
                        >
                            {tab}
                        </Button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Stats Cards */}
                        <StatCard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            icon={<Users className="h-5 w-5" />}
                            color="blue"
                        />
                        <StatCard
                            title="Paid Users"
                            value={stats?.paidUsers || 0}
                            icon={<CreditCard className="h-5 w-5" />}
                            color="green"
                            subtitle={`${stats?.totalUsers ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1) : 0}% conversion`}
                        />
                        <StatCard
                            title="Free Users"
                            value={stats?.freeUsers || 0}
                            icon={<Users className="h-5 w-5" />}
                            color="slate"
                        />
                        <StatCard
                            title="Total Generations"
                            value={stats?.totalGenerations || 0}
                            icon={<FileText className="h-5 w-5" />}
                            color="purple"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                            icon={<TrendingUp className="h-5 w-5" />}
                            color="emerald"
                        />
                        <StatCard
                            title="Open Tickets"
                            value={stats?.openTickets || 0}
                            icon={<MessageSquare className="h-5 w-5" />}
                            color="orange"
                        />
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Email</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Generations</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.is_premium
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                    }`}>
                                                    {user.is_premium ? "Premium" : "Free"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user.generations_count}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Support Tab */}
                {activeTab === "support" && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                        <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
                            Support Tickets
                        </h3>
                        <p className="mt-2 text-slate-500">
                            Support ticket management will appear here once users submit tickets.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
    subtitle
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                    )}
                </div>
                <div className={`rounded-xl p-3 ${colorClasses[color] || colorClasses.slate}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
