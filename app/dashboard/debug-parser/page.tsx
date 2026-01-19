"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, AlertTriangle, Sparkles, ArrowLeft, Bug } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DebugParserPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/debug-parser", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to parse");
            }

            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-indigo-100/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/80">
                <div className="container mx-auto flex h-full items-center justify-between px-6">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Astraz AI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Developer Mode
                        </span>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="ghost"
                            size="sm"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 pt-24 pb-12 max-w-7xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Bug className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">PDF Parser Debugger</h1>
                        <p className="text-slate-600 dark:text-slate-400">Inspect raw extraction data and normalization pipelines</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-8 shadow-sm">
                    <label className="block mb-6 cursor-pointer">
                        <span className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Target PDF File</span>
                        <div className="flex items-center gap-4">
                            <input type="file" accept=".pdf" onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2.5 file:px-6
                                file:rounded-xl file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                                transition-all
                            "/>
                            <Button onClick={handleUpload} disabled={!file || loading} className="min-w-[120px]">
                                {loading ? "Analyzing..." : "Run Diagnostics"}
                            </Button>
                        </div>
                    </label>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {result && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
                        <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0">
                                <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    Raw Extracted Text
                                </h3>
                                <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                                    {result.rawText.length} chars
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                                <pre className="whitespace-pre-wrap text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {result.rawText}
                                </pre>
                            </div>
                        </div>

                        <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0">
                                <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <Check className="w-4 h-4 text-green-500" />
                                    Normalized JSON
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                                <pre className="whitespace-pre-wrap text-xs font-mono text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                    {JSON.stringify(result.normalized, null, 2)}
                                </pre>

                                {result.normalized.unclassified_content && (
                                    <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                                        <h4 className="font-bold text-orange-500 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Recovery Buffer (Unclassified)
                                        </h4>
                                        <pre className="whitespace-pre-wrap text-xs font-mono text-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                            {result.normalized.unclassified_content}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
