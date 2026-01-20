"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Crown, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export function PaywallModal({ open, onOpenChange, onUpgrade }: PaywallModalProps) {
  const router = useRouter();

  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  const handlePlanSelect = (plan: string) => {
    onOpenChange(false);
    router.push(`/payment?plan=${plan}&currency=${currency}`);
  };

  const prices = {
    INR: { starter: "₹199", professional: "₹499", enterprise: "₹999" },
    USD: { starter: "$4.99", professional: "$9.99", enterprise: "$19.99" }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-center text-indigo-100">
            You've used your free trial. Unlock premium features to land your dream job.
          </DialogDescription>

          <div className="mt-4 flex justify-center">
            <div className="bg-white/20 p-1 rounded-lg flex items-center gap-1">
              <button
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${currency === "INR" ? "bg-white text-indigo-600 shadow-sm" : "text-white hover:bg-white/10"}`}
              >
                🇮🇳 INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${currency === "USD" ? "bg-white text-indigo-600 shadow-sm" : "text-white hover:bg-white/10"}`}
              >
                🌍 USD
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starter Plan */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Starter</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {prices[currency].starter}
              <span className="text-xs font-normal text-slate-500">/mo</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> 10 Generations/mo
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> PDF Downloads
              </li>
            </ul>
            <Button
              onClick={() => handlePlanSelect('starter')}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Get Starter
            </Button>
          </div>

          {/* Professional Plan - Highlighted */}
          <div className="relative rounded-xl border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 px-3 py-0.5 text-xs font-semibold text-white">
              POPULAR
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Professional</h3>
            <div className="text-2xl font-bold text-amber-600 mb-1">
              {prices[currency].professional}
              <span className="text-xs font-normal text-slate-500">/mo</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> 30 Generations/mo
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> Premium Templates
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> Cover Letters
              </li>
            </ul>
            <Button
              onClick={() => handlePlanSelect('professional')}
              className="w-full bg-amber-600 hover:bg-amber-700"
              size="sm"
            >
              Get Professional
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
            <h3 className="font-semibold mb-1">Enterprise</h3>
            <div className="text-2xl font-bold mb-1">
              {prices[currency].enterprise}
              <span className="text-xs font-normal text-slate-400">/mo</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-300">
                <Zap className="h-4 w-4 text-yellow-400" /> 100 Generations/mo
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Zap className="h-4 w-4 text-yellow-400" /> Priority Support
              </li>
            </ul>
            <Button
              onClick={() => handlePlanSelect('enterprise')}
              className="w-full bg-white text-slate-900 hover:bg-slate-100"
              size="sm"
            >
              Get Enterprise
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 pb-4">
          Secure payment via Razorpay • UPI, Cards, Net Banking
        </p>
      </DialogContent>
    </Dialog >
  );
}
