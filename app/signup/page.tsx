"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, validatePassword } from "@/lib/auth";
import { LegalModal } from "@/components/legal-modal";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!agreedToTerms) {
            setError("Please agree to the Terms of Service and Privacy Policy");
            return;
        }

        const { valid, errors } = validatePassword(formData.password);
        if (!valid) {
            setError(errors.join(". "));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const supabase = getSupabaseBrowserClient();

            // Create user
            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                    },
                },
            });

            if (signupError) {
                setError(signupError.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Update profile with additional info
                await supabase.from("profiles").upsert({
                    id: data.user.id,
                    email: formData.email.toLowerCase().trim(),
                    full_name: formData.fullName,
                    phone: formData.phone || null,
                    first_login_completed: true,
                });

                // Redirect to dashboard
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const passwordChecks = [
        { label: "At least 8 characters", valid: formData.password.length >= 8 },
        { label: "Lowercase letter", valid: /[a-z]/.test(formData.password) },
        { label: "Uppercase letter", valid: /[A-Z]/.test(formData.password) },
        { label: "Number", valid: /[0-9]/.test(formData.password) },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 py-12 relative overflow-hidden">
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

                {/* Signup Card */}
                <div className="rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-xl p-10 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-slate-950/50">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
                        Create Your Account
                    </h1>
                    <p className="text-slate-500 text-center mb-10">
                        Start building your dream career today
                    </p>

                    {error && (
                        <div className="mb-8 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    required
                                    autoComplete="name"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Phone <span className="text-slate-400">(optional)</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    autoComplete="tel"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a strong password"
                                    required
                                    autoComplete="new-password"
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
                            {formData.password && (
                                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                    {passwordChecks.map((check, i) => (
                                        <div key={i} className={`flex items-center gap-1 ${check.valid ? "text-emerald-600" : "text-slate-400"}`}>
                                            <Check className="h-3 w-3" /> {check.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    required
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-all"
                                />
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        {/* Terms Agreement */}
                        <div className="flex items-start gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                                I agree to the{" "}
                                <LegalModal type="terms" trigger={<span className="text-amber-600 hover:underline cursor-pointer">Terms of Service</span>} />
                                {" "}and{" "}
                                <LegalModal type="privacy" trigger={<span className="text-amber-600 hover:underline cursor-pointer">Privacy Policy</span>} />
                            </label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading || !agreedToTerms}
                            className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:scale-[1.02] mt-4 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...</>
                            ) : (
                                <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium hover:underline">
                            Sign In
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
