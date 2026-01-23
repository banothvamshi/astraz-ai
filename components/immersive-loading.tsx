"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Scan, FileSearch, Cpu, CheckCircle2 } from "lucide-react";

interface ImmersiveLoadingProps {
    status: string; // Current major status from parent
}

export function ImmersiveLoading({ status }: ImmersiveLoadingProps) {
    const [subStep, setSubStep] = useState(0);

    // Auto-cycle generic "thinking" messages if status hits a plateau
    const thinkingMessages = [
        "Triangulating data points...",
        "Verifying role hierarchies...",
        "Optimizing keywords for ATS...",
        "Structuring layout...",
        "Polishing typography..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setSubStep((prev) => (prev + 1) % thinkingMessages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="w-full max-w-lg p-8 relative">

                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl overflow-hidden"
                >
                    {/* Scan Line Animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-scan-line opacity-50" />

                    {/* Central Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-950">
                                <Cpu className="w-10 h-10 text-amber-500 animate-pulse" />
                            </div>

                            {/* orbiting particles */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border border-dashed border-amber-500/30"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-2 rounded-full border border-dotted border-indigo-500/30"
                            />
                        </div>
                    </div>

                    {/* Main Status */}
                    <h3 className="text-2xl font-bold text-center text-white mb-2 tracking-tight">
                        {status || "Agent Active"}
                    </h3>

                    {/* Sub Status (Dynamic) */}
                    <div className="h-6 overflow-hidden relative mb-8">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={subStep}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="text-center text-slate-400 text-sm font-mono"
                            >
                                {">"} {thinkingMessages[subStep]}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Progress Indicators */}
                    <div className="space-y-4">
                        {/* Visual Stream */}
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-500">
                                <Scan className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span>Visual Layer</span>
                                    <span className="text-emerald-500 text-xs">ACTIVE</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* OCR Stream */}
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-500">
                                <FileSearch className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span>OCR Text Extraction</span>
                                    <span className="text-blue-500 text-xs">PROCESSING</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 3, delay: 0.5, repeat: Infinity }}
                                        className="h-full bg-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Output Stream */}
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-purple-500">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span>Gemini 2.0 Synthesis</span>
                                    <span className="text-purple-500 text-xs">PENDING</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 4, delay: 1, repeat: Infinity }}
                                        className="h-full bg-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
