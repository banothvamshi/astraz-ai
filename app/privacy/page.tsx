"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

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

                    <h3>Information You Provide</h3>
                    <ul>
                        <li><strong>Account Data:</strong> Email address, password (encrypted)</li>
                        <li><strong>Resume Data:</strong> Personal information, work history, education, skills</li>
                        <li><strong>Job Descriptions:</strong> Text you paste for resume optimization</li>
                        <li><strong>Payment Data:</strong> Processed securely by Razorpay; we don't store card details</li>
                    </ul>

                    <h3>Automatically Collected</h3>
                    <ul>
                        <li>IP address and browser type</li>
                        <li>Usage analytics (pages visited, features used)</li>
                        <li>Device information</li>
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
                        Your data is stored securely on Supabase servers with industry-standard encryption.
                        We implement:
                    </p>
                    <ul>
                        <li>TLS/SSL encryption for all data transmission</li>
                        <li>Encrypted password storage using bcrypt</li>
                        <li>Row-level security policies</li>
                        <li>Regular security audits</li>
                        <li>Access controls and authentication</li>
                    </ul>

                    <h2>4. Data Sharing</h2>
                    <p>We do NOT sell your personal information. We may share data with:</p>
                    <ul>
                        <li><strong>Service Providers:</strong> Supabase (database), Razorpay (payments), Google (AI)</li>
                        <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
                    </ul>

                    <h2>5. AI Processing</h2>
                    <p>
                        Your resume and job description data is processed by Google's Gemini AI to generate
                        optimized content. This data is:
                    </p>
                    <ul>
                        <li>Not used to train AI models</li>
                        <li>Processed in real-time and not permanently stored by Google</li>
                        <li>Subject to Google's AI privacy policies</li>
                    </ul>

                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li><strong>Access:</strong> Request a copy of your personal data</li>
                        <li><strong>Correction:</strong> Update inaccurate information</li>
                        <li><strong>Deletion:</strong> Request permanent deletion of your account and data</li>
                        <li><strong>Portability:</strong> Export your data in a standard format</li>
                        <li><strong>Objection:</strong> Opt out of marketing communications</li>
                    </ul>

                    <h2>7. Data Retention</h2>
                    <ul>
                        <li>Active accounts: Data retained while account is active</li>
                        <li>Deleted accounts: Data permanently deleted within 30 days</li>
                        <li>Payment records: Retained for 7 years for legal compliance</li>
                    </ul>

                    <h2>8. Cookies</h2>
                    <p>We use essential cookies for:</p>
                    <ul>
                        <li>Authentication and session management</li>
                        <li>Security and fraud prevention</li>
                        <li>User preferences</li>
                    </ul>
                    <p>We do not use third-party advertising cookies.</p>

                    <h2>9. Children's Privacy</h2>
                    <p>
                        Our Service is not intended for users under 16 years of age. We do not knowingly
                        collect information from children.
                    </p>

                    <h2>10. International Transfers</h2>
                    <p>
                        Your data may be processed in countries outside your residence. We ensure adequate
                        protection through standard contractual clauses and compliant data processors.
                    </p>

                    <h2>11. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy periodically. Significant changes will be
                        communicated via email or prominent notice on our website.
                    </p>

                    <h2>12. Contact Us</h2>
                    <p>
                        For privacy-related questions or to exercise your rights, contact us at:
                        <br />
                        Email: privacy@astraz.ai
                    </p>
                </div>
            </div>
        </div>
    );
}
