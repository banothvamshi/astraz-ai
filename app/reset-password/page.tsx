"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, validatePassword } from "@/lib/auth";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFirstLogin = searchParams.get("first") === "true";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

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

            // Redirect to dashboard
            router.push("/dashboard");
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

                {/* Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    {isFirstLogin && (
                        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 dark:bg-amber-900/20 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-700 dark:text-amber-400">
                                <strong>First Login:</strong> Please set your own secure password to continue.
                            </div>
                        </div>
                    )}

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
                        {isFirstLogin ? "Set Your Password" : "Reset Password"}
                    </h1>
                    <p className="text-slate-500 text-center mb-8">
                        Create a strong, unique password for your account
                    </p>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
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
                                    placeholder="Enter new password"
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

                            {/* Password Requirements */}
                            {password && (
                                <div className="mt-3 space-y-1 text-xs">
                                    {["At least 8 characters", "Lowercase letter", "Uppercase letter", "Number"].map((req, i) => {
                                        const checks = [
                                            password.length >= 8,
                                            /[a-z]/.test(password),
                                            /[A-Z]/.test(password),
                                            /[0-9]/.test(password),
                                        ];
                                        return (
                                            <div key={i} className={`flex items-center gap-1 ${checks[i] ? "text-emerald-600" : "text-slate-400"}`}>
                                                <CheckCircle className="h-3 w-3" /> {req}
                                            </div>
                                        );
                                    })}
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
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-2 text-xs text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || passwordErrors.length > 0 || password !== confirmPassword}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                            ) : (
                                "Set Password"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
