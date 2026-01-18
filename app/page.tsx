"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Check, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasUsedTrial } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [hasTrial, setHasTrial] = useState(false);

  useEffect(() => {
    setHasTrial(hasUsedTrial());
  }, []);

  const handleGetStarted = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-slate-900">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Astraz AI
            </span>
          </div>
          <Button
            onClick={handleGetStarted}
            variant="outline"
            className="hidden sm:flex"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
            <Zap className="h-4 w-4" />
            <span>Beat ATS Systems • Land Your Dream Job</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl lg:text-7xl">
            Resume & Cover Letter
            <span className="bg-gradient-to-r from-blue-600 to-slate-900 bg-clip-text text-transparent">
              {" "}
              Generator
            </span>
          </h1>
          <p className="mb-8 text-xl text-slate-600 dark:text-slate-400 sm:text-2xl">
            Upload your resume, paste the job description, and get perfectly tailored application materials that pass ATS filters.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-800"
            >
              {hasTrial ? "Go to Dashboard" : "Try Free - No Signup"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!hasTrial && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                First generation is free
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-50 sm:text-4xl">
              Why Choose Astraz AI?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Professional-grade tools to help you stand out
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "ATS-Optimized",
                description: "Resumes formatted to pass Applicant Tracking Systems with perfect keyword matching.",
              },
              {
                icon: TrendingUp,
                title: "Job-Specific Tailoring",
                description: "Every resume and cover letter is customized to match the exact job description.",
              },
              {
                icon: Shield,
                title: "Professional Quality",
                description: "Enterprise-grade PDFs that look like they came from a professional service.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-50 sm:text-4xl">
              How It Works
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Upload Your Resume",
                description: "Upload your existing resume in PDF format.",
              },
              {
                step: "2",
                title: "Paste Job Description",
                description: "Copy and paste the job description you're applying for.",
              },
              {
                step: "3",
                title: "Get Tailored Results",
                description: "Receive ATS-optimized resume and cover letter ready to download.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-slate-900 text-lg font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-slate-900 p-12 text-center dark:border-slate-800">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to Land Your Dream Job?
          </h2>
          <p className="mb-8 text-lg text-blue-100">
            Join thousands of professionals who use Astraz AI to create winning applications.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            variant="outline"
            className="bg-white text-slate-900 hover:bg-slate-100"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-slate-900">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Astraz AI
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 Astraz AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
