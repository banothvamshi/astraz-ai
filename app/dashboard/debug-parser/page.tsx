"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, AlertTriangle } from "lucide-react";

export default function DebugParserPage() {
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
        <div className="container mx-auto p-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">PDF Parser Debug Tool</h1>

            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 mb-8">
                <label className="block mb-4">
                    <span className="sr-only">Choose PDF</span>
                    <input type="file" accept=".pdf" onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400
            "/>
                </label>

                <Button onClick={handleUpload} disabled={!file || loading}>
                    {loading ? "Parsing..." : "Debug PDF"}
                </Button>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {result && (
                <div className="grid grid-cols-2 gap-6 h-[800px]">
                    <div className="border rounded-xl p-4 overflow-auto bg-slate-50 dark:bg-slate-950">
                        <h3 className="font-bold mb-4 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 border-b flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Raw Extracted Text
                            <span className="text-xs font-normal text-slate-500 ml-auto">
                                {result.rawText.length} chars
                            </span>
                        </h3>
                        <pre className="whitespace-pre-wrap text-xs font-mono text-slate-700 dark:text-slate-300">
                            {result.rawText}
                        </pre>
                    </div>

                    <div className="border rounded-xl p-4 overflow-auto bg-slate-50 dark:bg-slate-950">
                        <h3 className="font-bold mb-4 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 border-b flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Normalized JSON
                        </h3>
                        <pre className="whitespace-pre-wrap text-xs font-mono text-slate-700 dark:text-slate-300">
                            {JSON.stringify(result.normalized, null, 2)}
                        </pre>

                        {result.normalized.unclassified_content && (
                            <div className="mt-6 border-t pt-4">
                                <h4 className="font-bold text-orange-500 mb-2">Unclassified Content</h4>
                                <pre className="whitespace-pre-wrap text-xs font-mono text-orange-800 bg-orange-50 p-2 rounded">
                                    {result.normalized.unclassified_content}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
