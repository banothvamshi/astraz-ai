import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/25">
                                <img src="/logo.png" alt="Astraz AI" className="h-full w-full rounded-[10px] bg-white dark:bg-slate-900 p-1" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">Astraz AI</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                            AI-powered resume optimization to help you land your dream job.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link href="/dashboard" className="hover:text-amber-600 transition-colors">Resume Builder</Link></li>
                            <li><Link href="/payment" className="hover:text-amber-600 transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link href="/contact" className="hover:text-amber-600 transition-colors">Contact Us</Link></li>
                            <li><a href="mailto:support@astrazai.com" className="hover:text-amber-600 transition-colors">Email Support</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link href="/privacy" className="hover:text-amber-600 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-amber-600 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-center text-sm text-slate-500">
                        © {new Date().getFullYear()} Astraz AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
