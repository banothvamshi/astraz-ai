"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Tag, Calendar, Hash, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Coupon {
    code: string;
    discount_type: 'percent' | 'flat';
    discount_value: number;
    max_uses: number | null;
    uses_count: number;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
}

export default function CouponManager() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newCoupon, setNewCoupon] = useState({
        code: "",
        discount_type: "percent",
        discount_value: "",
        max_uses: "",
        valid_until: ""
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch("/api/admin/coupons");
            const data = await res.json();
            if (data.coupons) setCoupons(data.coupons);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCoupon.code || !newCoupon.discount_value) {
            toast.error("Please fill required fields");
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: newCoupon.code,
                    discount_type: newCoupon.discount_type,
                    discount_value: Number(newCoupon.discount_value),
                    max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
                    valid_until: newCoupon.valid_until || null
                })
            });

            if (res.ok) {
                toast.success("Coupon created!");
                setNewCoupon({ code: "", discount_type: "percent", discount_value: "", max_uses: "", valid_until: "" });
                fetchCoupons();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create");
            }
        } catch (error) {
            toast.error("Server error");
        } finally {
            setIsCreating(false);
        }
    };

    const toggleStatus = async (code: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/coupons/${code}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (res.ok) {
                setCoupons(coupons.map(c => c.code === code ? { ...c, is_active: !currentStatus } : c));
                toast.success("Status updated");
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Coupon Manager</h1>
                    <p className="text-slate-500">Create and manage promo codes</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle>Create New Coupon</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Coupon Code</label>
                                <input
                                    placeholder="e.g. LAUNCH50"
                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent uppercase"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                                        value={newCoupon.discount_type}
                                        onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="flat">Flat Amount (₹/$)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Value</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 20"
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                                        value={newCoupon.discount_value}
                                        onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Uses (Optional)</label>
                                    <input
                                        type="number"
                                        placeholder="Unlimited"
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                                        value={newCoupon.max_uses}
                                        onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Expiry (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                                        value={newCoupon.valid_until}
                                        onChange={e => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isCreating ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Coupon"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coupons.map((coupon) => (
                    <div key={coupon.code} className={`p-6 rounded-2xl border ${coupon.is_active ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30' : 'border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800'} relative overflow-hidden transition-all hover:shadow-md`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold font-mono tracking-wider text-slate-900 dark:text-white">{coupon.code}</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `Flat ${coupon.discount_value} OFF`}
                                </p>
                            </div>
                            <button onClick={() => toggleStatus(coupon.code, coupon.is_active)} className="text-slate-400 hover:text-amber-600 transition-colors">
                                {coupon.is_active ? <ToggleRight className="h-8 w-8 text-emerald-500" /> : <ToggleLeft className="h-8 w-8" />}
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 opacity-50" />
                                <span>Used: <strong className="text-slate-900 dark:text-white">{coupon.uses_count}</strong> {coupon.max_uses ? `/ ${coupon.max_uses}` : 'times'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 opacity-50" />
                                <span>Expires: {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'Never'}</span>
                            </div>
                        </div>

                        {!coupon.is_active && (
                            <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transform -rotate-12">Inactive</span>
                            </div>
                        )}
                    </div>
                ))}

                {coupons.length === 0 && !isLoading && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No coupons created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
