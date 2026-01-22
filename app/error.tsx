"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Ideally log to Sentry here
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Something went wrong!
                </h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
                    Our reliability systems caught an unexpected error. The team has been notified.
                </p>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-100 dark:border-red-900/50 font-mono text-sm text-red-600 dark:text-red-400 mb-6 text-left overflow-auto max-w-lg max-h-32">
                    {error.message || "Unknown Application Error"}
                </div>
            </div>
            <div className="flex gap-4">
                <Button onClick={() => window.location.href = "/"} variant="outline">
                    Go Home
                </Button>
                <Button onClick={() => reset()}>Try Again</Button>
            </div>
        </div>
    );
}
