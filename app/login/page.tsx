"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth";

export default function LoginPage() {
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
                // Check if first login (needs password reset)
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_login_completed, is_admin")
                    .eq("id", data.user.id)
                    .single();

                if (profile?.is_admin) {
                    // Set admin cookie for middleware
                    document.cookie = `astraz_admin_key=${process.env.NEXT_PUBLIC_ADMIN_KEY || "astraz-admin-2024"}; path=/; max-age=86400`;
                    router.push("/admin");
                } else if (!profile?.first_login_completed) {
                    // First login - redirect to password reset
                    router.push("/reset-password?first=true");
                } else {
                    router.push("/dashboard");
                }
            }
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">Astraz AI</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 text-center mb-8">
                        Sign in to access your account
                    </p>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
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
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Sign Up
                        </Link>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center text-xs text-slate-500">
                    <Link href="/terms" className="hover:text-slate-700">Terms of Service</Link>
                    <span className="mx-2">•</span>
                    <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
                </div>
            </div>
        </div>
    );
}
