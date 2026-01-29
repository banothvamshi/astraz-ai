"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-slate-50 dark:bg-neutral-950 border-t border-slate-200 dark:border-white/10 py-16">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="font-bold text-2xl">Astraz AI</span>
                        </div>
                        <p className="text-slate-500 max-w-sm">
                            Advanced resume engineering for the modern professional. Built with love and plenty of caffeine.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-slate-500">
                            <li><Link href="/#features" className="hover:text-amber-500 transition-colors">Features</Link></li>
                            <li><Link href="/payment" className="hover:text-amber-500 transition-colors">Pricing</Link></li>
                            <li><Link href="/dashboard" className="hover:text-amber-500 transition-colors">Templates</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-slate-500">
                            <li><Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy</Link></li>
                            <li><Link href="/terms" className="hover:text-amber-500 transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-slate-200 dark:border-white/10 text-slate-500 text-sm">
                    <div>© {new Date().getFullYear()} Astraz AI Inc.</div>
                    <div className="flex gap-4">
                        {/* Social links removed as per request */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
