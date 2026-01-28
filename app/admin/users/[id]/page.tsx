"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Loader2, Shield, CreditCard,
    Calendar, Mail, History, TrendingUp, AlertTriangle, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Actions State
    const [creditAmount, setCreditAmount] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    const fetchUserDetails = async () => {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();

        // Fetch User Profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();

        if (profile?.id) {
            // Fetch Payment History
            const { data: userPayments } = await supabase
                .from("payments")
                .select("*")
                .eq("user_id", id)
                .order("created_at", { ascending: false });

            setPayments(userPayments || []);
        }

        setUser(profile);
        setIsLoading(false);
    };

    const handleAdjustCredits = async (amount: number) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/users/${id}/credits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, reason: "Admin manual adjustment" })
            });

            if (res.ok) {
                toast.success("Credits updated successfully");
                fetchUserDetails(); // Refresh
                setCreditAmount("");
            } else {
                toast.error("Failed to update credits");
            }
        } catch (e) {
            toast.error("Server error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpgrade = async (plan: string, credits: number) => {
        if (!confirm(`Are you sure you want to force upgrade this user to ${plan}?`)) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/users/${id}/upgrade`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, credits })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Upgraded to ${plan}`);
                // Update local state immediately with returned data if available, or fetch
                if (data.user) {
                    setUser(data.user);
                } else {
                    fetchUserDetails();
                }
            } else {
                // Try to parse error details
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.details || "Failed to upgrade";

                console.error("Upgrade failed:", errorData);
                toast.error(errorMessage);

                if (res.status === 404 && errorData.details) {
                    // Show a second, longer toast or alert for the critical key issue
                    alert(`CRITICAL ERROR:\n${errorData.details}`);
                }
            }
        } catch (e) {
            toast.error("Server error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSetExpiry = async () => {
        if (!expiryDate) return;
        setIsUpdating(true);
        try {
            // Fix Timezone Issue: input[datetime-local] gives "YYYY-MM-DDTHH:mm" (Local).
            // We must convert this Local time to UTC before sending to server to ensure 
            // the server doesn't treat it as UTC (which would shift the time by +Offset).
            const localDate = new Date(expiryDate);
            const utcIsoString = localDate.toISOString();

            const res = await fetch(`/api/admin/users/${id}/expiry`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expiryDate: utcIsoString })
            });

            if (res.ok) {
                toast.success("Subscription expiry updated");
                fetchUserDetails();
                // parsing back to local for input is hard because of the millisecond precision loss usually, 
                // but we can just clear it or leave it. 
                // Better UX: leave it populated or clear if successful? 
                // User might want to tweak. Let's leave it.
            } else {
                toast.error("Failed to update expiry date");
            }
        } catch (e) {
            toast.error("Server error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleClearExpiry = async () => {
        if (!confirm("Clear expiry date? User will have permanent premium access.")) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/users/${id}/expiry`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clear: true })
            });

            if (res.ok) {
                toast.success("Expiry cleared - user has permanent access");
                fetchUserDetails();
            } else {
                toast.error("Failed to clear expiry");
            }
        } catch (e) {
            toast.error("Server error");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-amber-600" /></div>;
    if (!user) return <div className="p-12 text-center">User not found</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>

            {/* Header / Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-3xl font-bold text-amber-600 dark:text-amber-500">
                        {user.full_name?.[0] || extractInitials(user.email)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.full_name || 'No Name'}</h1>
                        <div className="flex items-center gap-2 text-slate-500 mt-1">
                            <Mail className="h-4 w-4" /> {user.email}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                            {user.is_premium && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                                    <Shield className="h-3.5 w-3.5" /> {user.premium_type?.toUpperCase() || 'PREMIUM'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                        <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Credits Remaining</div>
                        <div className="text-4xl font-bold text-slate-900 dark:text-white font-mono">
                            {user.credits_remaining === -1 ? '∞' : user.credits_remaining}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Credit Control */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h2 className="text-lg font-bold">Credit Control</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Amount"
                                className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                                value={creditAmount}
                                onChange={e => setCreditAmount(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => handleAdjustCredits(Number(creditAmount))}
                                disabled={!creditAmount || isUpdating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                            >
                                <TrendingUp className="mr-2 h-4 w-4" /> Add Credits
                            </Button>
                            <Button
                                onClick={() => handleAdjustCredits(-Number(creditAmount))}
                                disabled={!creditAmount || isUpdating}
                                variant="destructive"
                                className="h-12"
                            >
                                <TrendingUp className="mr-2 h-4 w-4 rotate-180" /> Remove
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Subscription Expiry Control */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <h2 className="text-lg font-bold">Subscription Expiry</h2>
                    </div>

                    {/* Current Expiry Display */}
                    <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="text-xs text-slate-500 mb-1">Current Expiry</div>
                        {user.subscription_end_date ? (
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${new Date(user.subscription_end_date) < new Date() ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {new Date(user.subscription_end_date).toLocaleString()}
                                </span>
                                {new Date(user.subscription_end_date) < new Date() ? (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">EXPIRED</span>
                                ) : (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">ACTIVE</span>
                                )}
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400">No expiry set</span>
                        )}
                    </div>

                    <div className="space-y-3">
                        <input
                            type="datetime-local"
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                            value={expiryDate}
                            onChange={e => setExpiryDate(e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            {/* Action Buttons */}
                            <Button
                                onClick={handleSetExpiry}
                                disabled={!expiryDate || isUpdating}
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white h-9"
                            >
                                Set Expiry
                            </Button>
                            <Button
                                onClick={handleClearExpiry}
                                disabled={isUpdating || !user.subscription_end_date}
                                variant="outline"
                                size="sm"
                                className="h-9"
                            >
                                Clear
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {/* Presets - Using offset shifting for correct Local ISO */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 30);
                                    const offset = d.getTimezoneOffset() * 60000;
                                    const localIso = new Date(d.getTime() - offset).toISOString().slice(0, 16);
                                    setExpiryDate(localIso);
                                }}
                                className="text-xs h-7"
                            >
                                +30d
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 90);
                                    const offset = d.getTimezoneOffset() * 60000;
                                    const localIso = new Date(d.getTime() - offset).toISOString().slice(0, 16);
                                    setExpiryDate(localIso);
                                }}
                                className="text-xs h-7"
                            >
                                +90d
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 365);
                                    const offset = d.getTimezoneOffset() * 60000;
                                    const localIso = new Date(d.getTime() - offset).toISOString().slice(0, 16);
                                    setExpiryDate(localIso);
                                }}
                                className="text-xs h-7"
                            >
                                +1yr
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Manager - Full Width */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold">Plan Manager</h2>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleUpgrade('starter', 10)}
                            disabled={isUpdating}
                            className="justify-between h-12"
                        >
                            <span>Starter Plan</span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">10 Credits</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleUpgrade('professional', 30)}
                            disabled={isUpdating}
                            className="justify-between h-12 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                        >
                            <span className="text-amber-700 dark:text-amber-400 font-bold">Professional Plan</span>
                            <span className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded">30 Credits</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleUpgrade('enterprise', 100)}
                            disabled={isUpdating}
                            className="justify-between h-12 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20"
                        >
                            <span className="text-indigo-700 dark:text-indigo-400 font-bold">Enterprise Plan</span>
                            <span className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded">100 Credits</span>
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> Use with caution. Overrides payment status.
                    </p>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600">
                        <History className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold">Payment History</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Date</th>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Expiry (Valid Until)</th>
                                <th className="px-4 py-3 rounded-r-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No payment history found</td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                            {new Date(p.created_at).toLocaleDateString()}
                                            <div className="text-xs text-slate-400">{new Date(p.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{p.razorpay_order_id}</td>
                                        <td className="px-4 py-3">{(p.amount / 100).toFixed(2)} {p.currency}</td>
                                        <td className="px-4 py-3 capitalize">
                                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium">
                                                {p.plan_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {p.subscription_end_date ? new Date(p.subscription_end_date).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'captured' || p.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function extractInitials(email: string) {
    return email ? email.substring(0, 2).toUpperCase() : 'U';
}
