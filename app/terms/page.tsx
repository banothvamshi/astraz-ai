"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Astraz AI</span>
                    </Link>
                    <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </div>
            </nav>

            {/* Content */}
            <div className="container mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
                <p className="text-slate-500 mb-12">Last updated: January 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Astraz AI ("Service"), you agree to be bound by these Terms of Service.
                        If you do not agree to these terms, please do not use our Service.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        Astraz AI provides AI-powered resume optimization services. We use artificial intelligence to
                        analyze job descriptions and generate ATS-optimized resumes based on user-provided information.
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
                        <li>Premium access requires a one-time payment</li>
                        <li>All payments are processed securely through Razorpay</li>
                        <li>Prices are subject to change with reasonable notice</li>
                        <li>Refunds are available within 7 days of purchase if the service was not used</li>
                    </ul>

                    <h2>5. Acceptable Use</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Use the Service for any illegal purpose</li>
                        <li>Upload false, misleading, or fraudulent information</li>
                        <li>Attempt to reverse-engineer, hack, or exploit the Service</li>
                        <li>Use automated tools to access the Service without permission</li>
                        <li>Share, resell, or redistribute generated content commercially</li>
                    </ul>

                    <h2>6. Intellectual Property</h2>
                    <p>
                        The resume content you provide remains your property. The AI-generated output is licensed to
                        you for personal use. Astraz AI retains rights to the underlying technology and algorithms.
                    </p>

                    <h2>7. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "as is" without warranties of any kind. We do not guarantee that
                        using our Service will result in job interviews or employment. Results may vary based on
                        individual circumstances, job market conditions, and employer requirements.
                    </p>

                    <h2>8. Limitation of Liability</h2>
                    <p>
                        Astraz AI shall not be liable for any indirect, incidental, special, consequential, or
                        punitive damages arising from your use of the Service. Our total liability shall not
                        exceed the amount you paid for the Service.
                    </p>

                    <h2>9. Termination</h2>
                    <p>
                        We reserve the right to terminate or suspend your account at any time for violations of
                        these terms or for any other reason at our sole discretion.
                    </p>

                    <h2>10. Changes to Terms</h2>
                    <p>
                        We may update these terms from time to time. Continued use of the Service after changes
                        constitutes acceptance of the new terms.
                    </p>

                    <h2>11. Contact</h2>
                    <p>
                        For questions about these Terms, please contact us at support@astraz.ai
                    </p>
                </div>
            </div>
        </div>
    );
}
