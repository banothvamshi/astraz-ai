"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Shield, FileText } from "lucide-react";

interface LegalModalProps {
    type: "terms" | "privacy";
    trigger: React.ReactNode;
}

export function LegalModal({ type, trigger }: LegalModalProps) {
    const [open, setOpen] = useState(false);

    const content = type === "terms" ? termsContent : privacyContent;
    const title = type === "terms" ? "Terms of Service" : "Privacy Policy";
    const Icon = type === "terms" ? FileText : Shield;

    return (
        <>
            <span onClick={() => setOpen(true)} className="cursor-pointer">
                {trigger}
            </span>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-amber-600" />
                            {title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-grow pr-2 text-sm text-slate-600 dark:text-slate-400">
                        {content}
                    </div>
                    <div className="flex-shrink-0 pt-4 border-t">
                        <Button onClick={() => setOpen(false)} className="w-full bg-amber-600 hover:bg-amber-700">
                            I Understand
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

const termsContent = (
    <div className="space-y-4">
        <p className="text-xs text-slate-500">Last updated: January 2026</p>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
            <p>By accessing or using Astraz AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">2. Description of Service</h3>
            <p>Astraz AI provides AI-powered resume optimization services. We use artificial intelligence to analyze job descriptions and generate ATS-optimized resumes based on user-provided information.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">3. User Accounts</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>One account per user; account sharing is prohibited</li>
            </ul>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">4. Payment Terms</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Monthly subscription billing; cancel anytime</li>
                <li>All payments are processed securely through Razorpay</li>
                <li>Prices are subject to change with reasonable notice</li>
                <li>Refunds available within 7 days if service was not used</li>
            </ul>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">5. Acceptable Use</h3>
            <p>You agree NOT to: use the Service for illegal purposes, upload false information, attempt to hack or exploit the Service, or share/resell generated content commercially.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">6. Intellectual Property</h3>
            <p>The resume content you provide remains your property. The AI-generated output is licensed to you for personal use. Astraz AI retains rights to the underlying technology.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">7. Disclaimer</h3>
            <p>The Service is provided "as is" without warranties. We do not guarantee job interviews or employment. Results vary based on individual circumstances and market conditions.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">8. Limitation of Liability</h3>
            <p>Astraz AI shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid for the Service.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">9. Governing Law</h3>
            <p>These Terms are governed by the laws of India. Any disputes shall be resolved through arbitration in Hyderabad, Telangana.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">10. Contact</h3>
            <p>For questions about these Terms, please contact us at support@astrazai.com</p>
        </section>
    </div>
);

const privacyContent = (
    <div className="space-y-4">
        <p className="text-xs text-slate-500">Last updated: January 2026</p>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">1. Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Data:</strong> Email address, password (encrypted)</li>
                <li><strong>Resume Data:</strong> Personal information, work history, education, skills</li>
                <li><strong>Job Descriptions:</strong> Text you paste for resume optimization</li>
                <li><strong>Payment Data:</strong> Processed securely by Razorpay; we don't store card details</li>
            </ul>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">2. How We Use Your Information</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>To provide and improve our resume optimization service</li>
                <li>To process payments and manage your account</li>
                <li>To communicate important updates and support requests</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To prevent fraud and ensure security</li>
            </ul>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">3. Data Storage & Security</h3>
            <p>Your data is stored securely on Supabase servers with industry-standard encryption. We implement TLS/SSL encryption, encrypted password storage, and row-level security policies.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">4. AI Processing</h3>
            <p>Your resume and job description data is processed by Google's Gemini AI. This data is not used to train AI models and is processed in real-time without permanent storage by Google.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">5. Your Rights</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request permanent deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
            </ul>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">6. Data Retention</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Active accounts: Data retained while account is active</li>
                <li>Deleted accounts: Data permanently deleted within 30 days</li>
                <li>Payment records: Retained for 7 years for legal compliance</li>
            </ul>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">7. Cookies</h3>
            <p>We use essential cookies for authentication, session management, and security. We do not use third-party advertising cookies.</p>
        </section>

        <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">8. Contact Us</h3>
            <p>For privacy-related questions, contact us at privacy@astrazai.com</p>
        </section>
    </div>
);
