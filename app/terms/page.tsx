"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
            <FloatingNav />

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto max-w-4xl px-6 lg:px-8 py-32 relative z-10"
            >
                <div className="mb-8">
                    <Link href="/" className="text-sm text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-500 flex items-center gap-2 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">Terms of Service</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mb-16">Last updated: January 2026</p>
                </div>

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
            </motion.div>
        </div>
    );
}
