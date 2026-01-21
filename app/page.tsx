"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Check, Zap, Shield, TrendingUp, Cpu, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasUsedTrial } from "@/lib/storage";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [hasTrial, setHasTrial] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  useEffect(() => {
    setHasTrial(hasUsedTrial());

    // Check for active session
    const checkSession = async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/auth");
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsLoggedIn(true);
    };
    checkSession();
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
      return;
    }
    // If user has used their trial and not logged in, they might still be new
    if (hasTrial) {
      router.push("/payment");
    } else {
      router.push("/dashboard");
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Background Aurora Effect
  const AuroraBackground = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-amber-500/20 blur-[120px] mix-blend-screen animate-aurora" />
      <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-cyan-500/20 blur-[120px] mix-blend-screen animate-aurora delay-1000" />
      <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[100px] mix-blend-screen animate-aurora delay-2000" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 selection:bg-amber-500/30">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800/50"
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/")}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Astraz AI" className="h-full w-full rounded-[10px] bg-white dark:bg-slate-900 p-1" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Astraz AI</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="px-6 h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-xl rounded-xl"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/login")}
                  variant="ghost"
                  className="hidden sm:flex px-6 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="px-6 h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-xl rounded-xl"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <AuroraBackground />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/50 px-4 py-1.5 text-sm font-medium text-amber-700 backdrop-blur-md dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              AI-Powered Resume Engineering v2.0
            </motion.div>

            <motion.h1 variants={fadeIn} className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Build an <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-500">ATS-Optimized Resume</span> that gets you hired.
            </motion.h1>

            <motion.p variants={fadeIn} className="mb-10 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Stop getting rejected by bots. Our <span className="font-semibold text-slate-900 dark:text-white">Advanced AI Engine</span> analyzes job descriptions to engineer a resume that passes 99% of Applicant Tracking Systems.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="h-14 px-8 text-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all rounded-full"
              >
                {hasTrial ? "View Plans" : "Optimize My Resume Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div variants={fadeIn} className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> 100% Free Trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> No Credit Card
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> Instant PDF Download
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-amber-600">50K+</div>
              <div className="text-sm text-slate-500 mt-1">Resumes Optimized</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-emerald-600">99%</div>
              <div className="text-sm text-slate-500 mt-1">ATS Pass Rate</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-purple-600">3x</div>
              <div className="text-sm text-slate-500 mt-1">More Interviews</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-cyan-600">~15 sec</div>
              <div className="text-sm text-slate-500 mt-1">Generation Time</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid (Bento Style) */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Engineered for Success</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We don't just "write" resumes. We compile them using data-driven strategies that align with modern hiring algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group md:col-span-2 relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Deep ATS Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  Our engine reverse-engineers the job description to identify critical keywords, skills, and semantic patterns that the ATS is scoring for.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-6 text-cyan-600 dark:text-cyan-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Score Optimization</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Instant feedback on how well your profile matches the role.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Enterprise Formatting</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Clean, professional layouts preferred by Fortune 500 recruiters.
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Privacy First</h3>
                <p className="text-slate-300 max-w-md">
                  Your data is processed securely and never shared with third parties. We believe in complete data sovereignty for job seekers.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Loved by Job Seekers</h2>
            <p className="text-slate-600 dark:text-slate-400">Real results from real users</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                "Applied to 5 jobs with my old resume - nothing. Used Astraz AI once, got 3 interviews in a week. The ATS optimization is real."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-amber-600 font-bold">R</div>
                <div>
                  <p className="font-semibold text-sm">Rahul M.</p>
                  <p className="text-xs text-slate-500">Software Engineer</p>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                "As a fresher, I had no idea how to structure my resume. Astraz AI took my basic info and transformed it into something professional."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 font-bold">P</div>
                <div>
                  <p className="font-semibold text-sm">Priya S.</p>
                  <p className="text-xs text-slate-500">Data Analyst</p>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                "The keyword optimization is incredible. My resume now mirrors exactly what companies are looking for. Worth every rupee."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 font-bold">A</div>
                <div>
                  <p className="font-semibold text-sm">Ankit K.</p>
                  <p className="text-xs text-slate-500">Product Manager</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-amber-600 to-purple-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-4"
          >
            Ready to Land Your Dream Job?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of professionals who've transformed their job search with AI-powered resume optimization.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="h-14 px-10 text-lg bg-white text-amber-700 hover:bg-slate-100 transition-all rounded-full font-semibold"
            >
              Start Optimizing for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Astraz AI" className="h-8 w-8" />
              <span className="text-lg font-bold">Astraz AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/terms" className="hover:text-amber-600 transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-amber-600 transition-colors">Privacy Policy</a>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 Astraz AI. Engineered for Excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
