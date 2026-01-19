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
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  useEffect(() => {
    setHasTrial(hasUsedTrial());
  }, []);

  const handleGetStarted = () => {
    router.push("/dashboard");
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
      <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-[120px] mix-blend-screen animate-aurora" />
      <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-cyan-500/20 blur-[120px] mix-blend-screen animate-aurora delay-1000" />
      <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[100px] mix-blend-screen animate-aurora delay-2000" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/50 backdrop-blur-xl dark:bg-slate-950/50"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Astraz AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGetStarted}
              variant="ghost"
              className="hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Sign In
            </Button>
            <Button
              onClick={handleGetStarted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
            >
              Get Started
            </Button>
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
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/50 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur-md dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              AI-Powered Resume Engineering v2.0
            </motion.div>

            <motion.h1 variants={fadeIn} className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Beat the ATS. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
                Land the Interview.
              </span>
            </motion.h1>

            <motion.p variants={fadeIn} className="mb-10 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Stop guessing keywords. Our advanced AI analyzes job descriptions and engineers your resume to structurally pass 99% of Applicant Tracking Systems.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="h-14 px-8 text-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all rounded-full"
              >
                {hasTrial ? "Go to Dashboard" : "Optimize My Resume Free"}
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
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
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

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">Astraz AI</span>
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
