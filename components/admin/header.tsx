"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 w-full max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users, payments, or logs..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button size="icon" variant="ghost" className="relative">
                    <Bell className="h-5 w-5 text-slate-500" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                    A
                </div>
            </div>
        </header>
    );
}
