import { createClient } from "@/utils/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { formatAdminDate } from "@/lib/date-utils";

export const revalidate = 0; // Ensure fresh data on every request

export default async function AdminPayments() {
    const supabase = await createClient();

    // Fetch all payments ordered by date
    const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        return <div>Error loading payments</div>;
    }

    // Fetch associated user profiles
    const userIds = Array.from(new Set(payments?.map(p => p.user_id).filter(Boolean)));
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, subscription_end_date")
        .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payments</h1>
                    <p className="text-slate-500">Track and manage financial transactions.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Export CSV</Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search order ID..."
                        />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.map((payment) => {
                            const profile = profileMap.get(payment.user_id);
                            return (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium text-slate-900 dark:text-white">
                                        {formatAdminDate(payment.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 dark:text-white">{profile?.full_name || "Unknown"}</span>
                                            <span className="text-xs text-slate-500">{profile?.email || "No email"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {payment.razorpay_order_id}
                                    </TableCell>
                                    <TableCell>
                                        ₹{(payment.amount / 100).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {payment.plan_type || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                        {profile?.subscription_end_date ? formatAdminDate(profile.subscription_end_date) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={payment.status === 'captured' ? 'default' : 'secondary'}
                                            className={payment.status === 'captured' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                        >
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
