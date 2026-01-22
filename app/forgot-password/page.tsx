"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const supabase = getSupabaseBrowserClient();
            const emailLower = email.toLowerCase().trim();

            // Check if email exists in profiles table first
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", emailLower)
                .single();

            if (profileError || !profile) {
                setError("No account found with this email address. Please check your email or sign up.");
                setIsLoading(false);
                return;
            }

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                emailLower,
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );

            if (resetError) {
                setError(resetError.message);
            } else {
                setIsSuccess(true);
            }
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 shadow-xl shadow-emerald-500/20">
                        <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Check Your Email
                    </h1>
                    <p className="text-lg text-slate-500 mb-8">
                        We've sent a password reset link to <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-300 hover:border-amber-500 hover:text-amber-600 transition-all">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex flex-col items-center gap-3 group">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-xl shadow-amber-500/30 transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Astraz AI" className="h-full w-full rounded-[14px] bg-white dark:bg-slate-900 p-1.5" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Astraz AI</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
                        Forgot Password?
                    </h1>
                    <p className="text-slate-500 text-center mb-10">
                        Enter your email and we'll send you a reset link
                    </p>

                    {error && (
                        <div className="mb-8 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-sm text-amber-600 hover:text-amber-700 flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
