"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export function FloatingNav() {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useTransform(scrollY, [0, 100], [0, 1]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        // Check for active session
        const checkSession = async () => {
            const { getSupabaseBrowserClient } = await import("@/lib/auth");
            const supabase = getSupabaseBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setIsLoggedIn(true);
        };
        checkSession();
    }, []);


    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
                isScrolled
                    ? "bg-white/80 dark:bg-black/80 backdrop-blur-md border-slate-200/50 dark:border-white/10 py-4"
                    : "bg-transparent border-transparent py-6"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => router.push("/")}
                >
                    <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 p-[1px]">
                        <img src="/logo.png" alt="Astraz AI" className="h-full w-full rounded-[10px] bg-white dark:bg-black p-1 object-cover" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Astraz <span className="text-amber-600 dark:text-amber-500">AI</span>
                    </span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="/#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Features</a>
                    <a href="/#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Testimonials</a>
                    <a href="/payment" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Pricing</a>

                    <div className="flex items-center gap-4 ml-4">
                        {isLoggedIn ? (
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                            >
                                Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => router.push("/login")} className="hover:bg-slate-100 dark:hover:bg-white/10">
                                    Sign In
                                </Button>
                                <Button
                                    onClick={() => router.push("/dashboard")}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Toggle */}
                <div className="md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="md:hidden bg-white dark:bg-black border-b border-slate-200 dark:border-white/10"
                >
                    <div className="flex flex-col p-6 space-y-4">
                        <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-900 dark:text-white">Features</a>
                        <a href="/#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-900 dark:text-white">Testimonials</a>
                        <a href="/payment" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-900 dark:text-white">Pricing</a>
                        <hr className="border-slate-200 dark:border-white/10" />
                        <Button variant="ghost" onClick={() => router.push("/login")} className="justify-start px-0">Sign In</Button>
                        <Button onClick={() => router.push("/dashboard")} className="w-full">Get Started</Button>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}
