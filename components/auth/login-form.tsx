"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth";

import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const supabase = getSupabaseBrowserClient();

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password,
            });

            if (authError) {
                setError(authError.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Check user profile for admin status
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_login_completed, is_admin")
                    .eq("id", data.user.id)
                    .single();

                if (profile?.is_admin) {
                    // Force hard navigation to ensure cookies are sent to server
                    // This bypasses Next.js Router cache which might hold a stale "unauth" state
                    window.location.href = "/admin";
                    return;
                } else if (profile && profile.first_login_completed === false) {
                    // Only for payment-created accounts (explicitly false, not null)
                    router.push("/reset-password?first=true");
                } else {
                    // Normal users go to dashboard
                    router.refresh();
                    router.push("/dashboard");
                }
            }
        } catch (err: any) {
            console.error("Unexpected login error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex flex-col items-center gap-3 group">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-xl shadow-amber-500/30 transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Astraz AI" className="h-full w-full rounded-[14px] bg-white dark:bg-slate-900 p-1.5" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Astraz AI</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-xl p-10 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-slate-950/50">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 text-center mb-10">
                        Sign in to continue building your career
                    </p>

                    {error && (
                        <div className="mb-8 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="username"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 py-3 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-[1.02]"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight className="ml-2 h-5 w-5" /></>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-amber-600 hover:text-amber-700 font-medium hover:underline">
                            Sign Up
                        </Link>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center text-xs text-slate-500">
                    <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</Link>
                    <span className="mx-2">•</span>
                    <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>
                </div>
            </motion.div>
        </div>
    );
}
