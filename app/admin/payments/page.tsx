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

export default async function AdminPayments() {
    const supabase = await createClient();

    // Fetch all payments ordered by date
    // In a real app, this should be paginated
    const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        return <div>Error loading payments</div>;
    }

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
                            <TableHead>Order ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium text-slate-900 dark:text-white">
                                    {new Date(payment.created_at).toLocaleDateString()} <br />
                                    <span className="text-xs text-slate-500">{new Date(payment.created_at).toLocaleTimeString()}</span>
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
                                <TableCell>
                                    <Badge
                                        variant={payment.status === 'captured' ? 'default' : 'secondary'}
                                        className={payment.status === 'captured' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                    >
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
