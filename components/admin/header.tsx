"use client";

import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function AdminHeader() {
    const [isDark, setIsDark] = useState(false);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        // Check dark mode
        setIsDark(document.documentElement.classList.contains('dark'));

        // Update time
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(!isDark);
    };

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center justify-between h-full px-6">
                {/* Left - Search */}
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="pl-10 pr-4 py-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-3">
                    {/* Current Time */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {currentTime}
                    </div>

                    {/* Notifications */}
                    <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </Button>

                    {/* Dark Mode Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleDarkMode}
                        className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {isDark ? (
                            <Sun className="h-5 w-5 text-amber-500" />
                        ) : (
                            <Moon className="h-5 w-5 text-slate-600" />
                        )}
                    </Button>

                    {/* Admin Avatar */}
                    <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Super Admin</p>
                            <p className="text-xs text-slate-500">Full Access</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
                            SA
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
