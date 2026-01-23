"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, Search, MoreVertical, Shield, ShieldAlert, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const USERS_PER_PAGE = 20;

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [generationCounts, setGenerationCounts] = useState<Record<string, number>>({});
    const [anonymousGenerations, setAnonymousGenerations] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();

        // Fetch users from profiles
        const { data: profilesData } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        // Fetch all generations to count per user
        const { data: generationsData } = await supabase
            .from("generations")
            .select("user_id");

        // Count generations per user
        const counts: Record<string, number> = {};
        let anonCount = 0;
        if (generationsData) {
            for (const gen of generationsData) {
                if (gen.user_id) {
                    counts[gen.user_id] = (counts[gen.user_id] || 0) + 1;
                } else {
                    anonCount++;
                }
            }
        }
        setGenerationCounts(counts);
        setAnonymousGenerations(anonCount);

        if (profilesData) setUsers(profilesData);
        setIsLoading(false);
    };

    const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase
            .from("profiles")
            .update({ is_admin: !currentStatus })
            .eq("id", userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (!error) {
            setUsers(users.filter(u => u.id !== userId));
        } else {
            alert("Failed to delete user. You may not have sufficient permissions.");
            console.error("Delete error:", error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // CSV Export function
    const handleExportCSV = () => {
        const headers = ["Email", "Name", "Role", "Premium", "Credits", "Expiry", "Joined"];
        const rows = filteredUsers.map(user => [
            user.email || "",
            user.full_name || "",
            user.is_admin ? "Admin" : "User",
            user.is_premium ? "Yes" : "No",
            user.credits_remaining === -1 ? "Unlimited" : (user.credits_remaining || 0),
            user.credits_remaining === -1 ? "Unlimited" : (user.credits_remaining || 0),
            user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : "N/A",
            new Date(user.created_at).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `astraz-users-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                    <p className="text-slate-500">Manage user access and permissions</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Anonymous Generations Summary */}
            {anonymousGenerations > 0 && (
                <div className="rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-lg">👤</span>
                        </div>
                        <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">Anonymous/Guest Generations</p>
                            <p className="text-sm text-slate-500">Users who generated resumes without creating an account</p>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{anonymousGenerations}</div>
                </div>
            )}

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Expiry</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Credits</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Generations</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">Joined</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 font-bold dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400">
                                                    {user.email?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <Link href={`/admin/users/${user.id}`} className="font-medium text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400">
                                                        {user.full_name || 'User'}
                                                    </Link>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_admin ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                                    <Shield className="h-3.5 w-3.5" /> Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_premium ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <CheckCircle className="h-3.5 w-3.5" /> Premium
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    Free
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {user.credits_remaining === -1 ? 'Unlimited' : user.credits_remaining || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {generationCounts[user.id] || user.total_generations || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        <MoreVertical className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.is_admin)} className="cursor-pointer">
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 cursor-pointer" onClick={() => handleDeleteUser(user.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <p className="text-sm text-slate-500">
                            Showing {startIndex + 1} - {Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
