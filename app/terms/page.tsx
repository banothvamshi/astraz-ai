"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">Terms of Service</h1>
                <p className="text-lg text-slate-500 mb-16">Last updated: January 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Astraz AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        Astraz AI provides AI-powered resume optimization services. We use artificial intelligence to analyze job descriptions and generate ATS-optimized resumes based on user-provided information.
                    </p>

                    <h2>3. User Accounts</h2>
                    <ul>
                        <li>You must provide accurate and complete information when creating an account</li>
                        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                        <li>You must notify us immediately of any unauthorized use of your account</li>
                        <li>One account per user; account sharing is prohibited</li>
                    </ul>

                    <h2>4. Payment Terms</h2>
                    <ul>
                        <li>Monthly subscription billing; cancel anytime</li>
                        <li>All payments are processed securely through Razorpay</li>
                        <li>Prices are subject to change with reasonable notice</li>
                        <li>Refunds available within 7 days if service was not used</li>
                    </ul>

                    <h2>5. Acceptable Use</h2>
                    <p>
                        You agree NOT to: use the Service for illegal purposes, upload false information, attempt to hack or exploit the Service, or share/resell generated content commercially.
                    </p>

                    <h2>6. Intellectual Property</h2>
                    <p>
                        The resume content you provide remains your property. The AI-generated output is licensed to you for personal use. Astraz AI retains rights to the underlying technology.
                    </p>

                    <h2>7. Disclaimer</h2>
                    <p>
                        The Service is provided "as is" without warranties. We do not guarantee job interviews or employment. Results vary based on individual circumstances and market conditions.
                    </p>

                    <h2>8. Limitation of Liability</h2>
                    <p>
                        Astraz AI shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid for the Service.
                    </p>

                    <h2>9. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of India. Any disputes shall be resolved through arbitration in Hyderabad, Telangana.
                    </p>

                    <h2>10. Contact</h2>
                    <p>
                        For questions about these Terms, please contact us at <a href="mailto:support@astrazai.com" className="text-amber-600 hover:underline">support@astrazai.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
