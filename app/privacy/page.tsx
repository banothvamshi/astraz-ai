"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
                <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Astraz AI" className="h-full w-full rounded-[10px] bg-white dark:bg-slate-900 p-1" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Astraz AI</span>
                    </Link>
                    <Link href="/" className="text-sm text-slate-600 hover:text-amber-600 flex items-center gap-2 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </div>
            </nav>

            {/* Content */}
            <div className="container mx-auto max-w-4xl px-6 lg:px-8 py-20">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
                <p className="text-lg text-slate-500 mb-16">Last updated: January 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h2>1. Information We Collect</h2>
                    <ul>
                        <li><strong>Account Data:</strong> Email address, password (encrypted)</li>
                        <li><strong>Resume Data:</strong> Personal information, work history, education, skills</li>
                        <li><strong>Job Descriptions:</strong> Text you paste for resume optimization</li>
                        <li><strong>Payment Data:</strong> Processed securely by Razorpay; we don't store card details</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <ul>
                        <li>To provide and improve our resume optimization service</li>
                        <li>To process payments and manage your account</li>
                        <li>To communicate important updates and support requests</li>
                        <li>To analyze usage patterns and improve user experience</li>
                        <li>To prevent fraud and ensure security</li>
                    </ul>

                    <h2>3. Data Storage & Security</h2>
                    <p>
                        Your data is stored securely on Supabase servers with industry-standard encryption. We implement TLS/SSL encryption, encrypted password storage, and row-level security policies.
                    </p>

                    <h2>4. AI Processing</h2>
                    <p>
                        Your resume and job description data is processed by Google's Gemini AI. This data is not used to train AI models and is processed in real-time without permanent storage by Google.
                    </p>

                    <h2>5. Your Rights</h2>
                    <ul>
                        <li><strong>Access:</strong> Request a copy of your personal data</li>
                        <li><strong>Correction:</strong> Update inaccurate information</li>
                        <li><strong>Deletion:</strong> Request permanent deletion of your account and data</li>
                        <li><strong>Portability:</strong> Export your data in a standard format</li>
                    </ul>

                    <h2>6. Data Retention</h2>
                    <ul>
                        <li><strong>Active accounts:</strong> Data retained while account is active</li>
                        <li><strong>Deleted accounts:</strong> Data permanently deleted within 30 days</li>
                        <li><strong>Payment records:</strong> Retained for 7 years for legal compliance</li>
                    </ul>

                    <h2>7. Cookies</h2>
                    <p>
                        We use essential cookies for authentication, session management, and security. We do not use third-party advertising cookies.
                    </p>

                    <h2>8. Contact Us</h2>
                    <p>
                        For privacy-related questions, contact us at <a href="mailto:privacy@astrazai.com" className="text-amber-600 hover:underline">privacy@astrazai.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
