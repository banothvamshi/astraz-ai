"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function ConfirmContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        // Check for confirmation result from URL hash/params
        const hash = window.location.hash;
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
            setStatus("error");
        } else if (hash.includes("access_token") || hash.includes("type=signup")) {
            setStatus("success");
        } else {
            // Default to success if we're here
            setStatus("success");
        }
    }, [searchParams]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Verification Failed
                    </h1>
                    <p className="text-slate-500 mb-8">
                        The confirmation link may have expired. Please try signing up again.
                    </p>
                    <Link href="/signup">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            Try Again
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md text-center"
            >
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30"
                >
                    <CheckCircle className="h-12 w-12 text-white" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Email Confirmed! 🎉
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                        Your account has been verified successfully. You're all set to start optimizing your resume!
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                >
                    <Button
                        onClick={() => router.push("/login")}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                        Sign In to Your Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Link href="/" className="block">
                        <Button variant="ghost" className="w-full">
                            Return to Home
                        </Button>
                    </Link>
                </motion.div>

                {/* Branding */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 flex items-center justify-center gap-2 text-slate-400"
                >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600">
                        <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">Astraz AI</span>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        }>
            <ConfirmContent />
        </Suspense>
    );
}
