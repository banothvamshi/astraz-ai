"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, validatePassword } from "@/lib/auth";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFirstLogin = searchParams.get("first") === "true";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [error, setError] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    // Check for session on mount - this page is only accessed via email recovery link
    useEffect(() => {
        const supabase = getSupabaseBrowserClient();

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // If we have a session, we're in recovery mode (user clicked the email link)
            if (session) {
                setIsRecoveryMode(true);
            } else {
                // Try to get session from URL hash (for PKCE flow)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');

                if (accessToken && type === 'recovery') {
                    // Set the session manually for recovery
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || '',
                    });
                    if (data.session) {
                        setIsRecoveryMode(true);
                    }
                }
            }
            setIsCheckingSession(false);
        };

        checkSession();
    }, []);

    useEffect(() => {
        if (password) {
            const { errors } = validatePassword(password);
            setPasswordErrors(errors);
        } else {
            setPasswordErrors([]);
        }
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate password
        const { valid, errors } = validatePassword(password);
        if (!valid) {
            setError(errors.join(". "));
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const supabase = getSupabaseBrowserClient();

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                setError(updateError.message);
                setIsLoading(false);
                return;
            }

            // Mark first login as completed if applicable
            if (isFirstLogin) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from("profiles")
                        .update({ first_login_completed: true, updated_at: new Date().toISOString() })
                        .eq("id", user.id);
                }
            }

            // FORCE LOGOUT to prevent auto-login
            await supabase.auth.signOut();

            // Redirect to login with success message
            router.push("/login?reset=success");
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        );
    }

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

                {/* Card */}
                <div className="rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-xl p-10 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-slate-950/50">
                    {isFirstLogin && (
                        <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 dark:bg-amber-900/20 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-700 dark:text-amber-400">
                                <strong>First Login:</strong> Please set your own secure password to continue.
                            </div>
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
                        {isFirstLogin ? "Set Your Password" : "Reset Password"}
                    </h1>
                    <p className="text-slate-500 text-center mb-10">
                        Create a strong, unique password for your account
                    </p>

                    {error && (
                        <div className="mb-8 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white/50 py-3.5 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            {password && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {["8+ chars", "Lowercase", "Uppercase", "Number"].map((req, i) => {
                                            const checks = [
                                                password.length >= 8,
                                                /[a-z]/.test(password),
                                                /[A-Z]/.test(password),
                                                /[0-9]/.test(password),
                                            ];
                                            return (
                                                <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${checks[i] ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"}`}>
                                                    <CheckCircle className={`h-3 w-3 ${checks[i] ? "block" : "hidden"}`} />
                                                    {req}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white/50 py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-2 text-xs text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-[1.02]"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating...</>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
