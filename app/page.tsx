"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Check, Zap, Shield, TrendingUp, Cpu, FileText, Lock, Star, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasUsedTrial } from "@/lib/storage";
import { motion, useScroll, useTransform, useInView, useSpring } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { cn } from "@/lib/utils";


import { FloatingNav } from "@/components/ui/floating-navbar";
import { Footer } from "@/components/ui/footer";

// --- Components for the Page ---


function Counter({ from, to }: { from: number; to: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true });

  const fromValue = from || 0;
  const toValue = to || 100;

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const current = Math.floor(progress * (toValue - fromValue) + fromValue);

      if (nodeRef.current) {
        nodeRef.current.textContent = current.toLocaleString();
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, fromValue, toValue]);

  return <span ref={nodeRef}>{fromValue}</span>;
}

export default function Home() {
  const router = useRouter();
  const [hasTrial, setHasTrial] = useState(false);

  useEffect(() => {
    setHasTrial(hasUsedTrial());
  }, []);

  const handleGetStarted = () => {
    // Logic for routing based on auth state
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white selection:bg-amber-500/30 overflow-x-hidden">
      <FloatingNav />

      {/* 1. Hero Section with Spotlight */}
      <section className="relative pt-36 pb-32 md:pt-48 md:pb-48 overflow-hidden bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium mb-8 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            v2.0 Now Available with AI Theme Designer
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-6 max-w-5xl mx-auto"
          >
            The #1 Best Free AI
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500">
              Resume Builder by Astraz AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10"
          >
            Create a professional, <span className="font-semibold text-slate-900 dark:text-white">ATS-friendly resume</span> in seconds.
            <br className="hidden md:block" />
            Designed to rank #1 in Google & Applicant Tracking Systems.
            <br />
            <span className="font-bold text-slate-900 dark:text-white mt-2 block">100% Free PDF Download. No Sign-up Required.</span>
            The best specialized alternative to Canva, Novoresume & Zety.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="h-14 px-8 rounded-full text-lg bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-transform shadow-2xl shadow-indigo-500/20"
            >
              Build My Resume Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

          </motion.div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-500/20 opacity-30 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* Trusted By Section */}
      <section className="py-10 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">
            Trusted by professionals from
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Using text representations since we don't have SVG logos handy, styled to look like logos */}
            <span className="text-xl md:text-2xl font-bold font-sans text-slate-700 dark:text-slate-300">Google</span>
            <span className="text-xl md:text-2xl font-bold font-serif text-slate-700 dark:text-slate-300">Microsoft</span>
            <span className="text-xl md:text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">Amazon</span>
            <span className="text-xl md:text-2xl font-extrabold text-slate-700 dark:text-slate-300 tracking-tighter">Netflix</span>
            <span className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 italic">Meta</span>
            <span className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300">Uber</span>
          </div>
        </div>
      </section>

      {/* 2. Stats with Counter Animation */}
      <section className="py-20 border-y border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { label: "Resumes Optimized", value: 50000, suffix: "+", color: "text-amber-500" },
              { label: "Interviews Landed", value: 85, suffix: "%", color: "text-emerald-500" },
              { label: "Salary Increase", value: 40, suffix: "%", color: "text-purple-500" },
              { label: "Success Rate", value: 99, suffix: "%", color: "text-blue-500" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className={`text-4xl lg:text-5xl font-bold ${stat.color}`}>
                  <Counter from={0} to={stat.value} />{stat.suffix}
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid */}
      <section id="features" className="py-32 bg-white dark:bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              The Ultimate Cheat Code <br />
              <span className="text-slate-400 dark:text-slate-600">for your career.</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              We've deconstructed millions of successful resumes to understand exactly what triggers the "YES" pile.
            </p>
          </div>

          <BentoGrid>
            <BentoGridItem
              title="AI Resume Generator with Semantic Matching"
              description="Our AI doesn't just keyword stuff. It rebuilds your experience to semantically align with the job description, making you the obvious choice."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/10 backdrop-blur-sm" />}
              icon={<Cpu className="h-4 w-4 text-amber-500" />}
              className="md:col-span-2"
            />
            <BentoGridItem
              title="Real-time ATS Resume Checker"
              description="See exactly what the bots see. Get an instant score and fix issues before you hit submit."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/10 backdrop-blur-sm" />}
              icon={<Zap className="h-4 w-4 text-emerald-500" />}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Professional Resume Templates"
              description="Instantly transform your resume from 'Corporate Professional' to 'Creative Lead' with one click."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/10 backdrop-blur-sm" />}
              icon={<FileText className="h-4 w-4 text-purple-500" />}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Bank-Grade Privacy & Security"
              description="We respect your data. Your resume is encrypted and never sold to third-party recruiters."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/10 backdrop-blur-sm" />}
              icon={<Shield className="h-4 w-4 text-blue-500" />}
              className="md:col-span-2"
            />
          </BentoGrid>
        </div>
      </section>

      {/* 4. Testimonials Infinite Cards */}
      <section id="testimonials" className="py-24 bg-slate-50 dark:bg-neutral-950/50 overflow-hidden">
        <div className="container mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">You're in good company.</h2>
          <p className="text-slate-500">Join thousands of professionals who landed their dream job.</p>
        </div>

        <InfiniteMovingCards
          items={[
            { quote: "I applied to 50 jobs with no luck. After using Astraz, I got 3 interviews in a week.", name: "Sarah J.", title: "Product Manager at Google" },
            { quote: "The AI suggested keywords I completely missed. It felt like cheating, but legal.", name: "Michael Chen", title: "Software Engineer at Meta" },
            { quote: "Finally a resume builder that doesn't mess up the formatting when downloading PDF.", name: "Emily R.", title: "Marketing Director" },
            { quote: "The dynamic themes are a game changer. I tailored my resume for a creative agency instantly.", name: "David K.", title: "UX Designer" },
            { quote: "Simple, fast, and effective. The dashboard UI is also really clean.", name: "Priya P.", title: "Data Analyst" },
          ]}
          direction="right"
          speed="slow"
        />
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white dark:bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-30" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Stop Wasting Time.</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            The best jobs are filled in 48 hours. Don't let your dream role slip away.
          </p>
          <Button
            onClick={() => router.push("/signup")}
            size="lg"
            className="h-16 px-10 text-xl rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105"
          >
            Start Building for Free
          </Button>
        </div>
      </section>

      <section className="py-12 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Why Choose Astraz AI as your Free Resume Builder?</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left text-sm text-slate-600 dark:text-slate-400">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Completely Free Resume Maker</h3>
                <p>Unlike other platforms that charge you at the last step, Astraz AI offers a truly free tier. Build, edit, and download your resume without paying a cent.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Beat Applicant Tracking Systems (ATS)</h3>
                <p>99% of Fortune 500 companies use ATS. Our resumes are engineered to pass these bots, ensuring your profile actually reaches a human recruiter.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Alternative to Canva & Novoresume</h3>
                <p>Canva resumes look good but fail ATS scans. Novoresume limits your customization. Astraz AI gives you the best of both worlds: Stunning design and perfect parsing.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Instant PDF Download</h3>
                <p>No watermarks. No hidden fees. Just click download and apply to your dream job using our industry-standard PDF format.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

