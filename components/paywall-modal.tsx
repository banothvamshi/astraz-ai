"use client";

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

  const handlePlanSelect = (plan: string) => {
    onOpenChange(false);
    router.push(`/payment?plan=${plan}`);
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
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Basic Plan */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Basic</h3>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              ₹99
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> 3 Generations
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> PDF Downloads
              </li>
            </ul>
            <Button
              onClick={() => handlePlanSelect('basic')}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Get Basic
            </Button>
          </div>

          {/* Pro Plan - Highlighted */}
          <div className="relative rounded-xl border-2 border-indigo-500 bg-indigo-50 p-4 dark:bg-indigo-950/30">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
              POPULAR
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Pro</h3>
            <div className="text-2xl font-bold text-indigo-600 mb-3">
              ₹299
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> 25 Generations
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> Premium Templates
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> Priority Support
              </li>
            </ul>
            <Button
              onClick={() => handlePlanSelect('pro')}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              Get Pro
            </Button>
          </div>

          {/* Unlimited Plan */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
            <h3 className="font-semibold mb-1">Unlimited</h3>
            <div className="text-2xl font-bold mb-3">
              ₹499
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-300">
                <Zap className="h-4 w-4 text-yellow-400" /> Unlimited
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Zap className="h-4 w-4 text-yellow-400" /> LinkedIn Optimization
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Zap className="h-4 w-4 text-yellow-400" /> Lifetime Access
              </li>
            </ul>
            <Button
              onClick={() => handlePlanSelect('unlimited')}
              className="w-full bg-white text-slate-900 hover:bg-slate-100"
              size="sm"
            >
              Go Unlimited
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 pb-4">
          Secure payment via Razorpay • UPI, Cards, Net Banking
        </p>
      </DialogContent>
    </Dialog>
  );
}
