"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export function PaywallModal({ open, onOpenChange, onUpgrade }: PaywallModalProps) {
  const features = [
    "Unlimited resume & cover letter generations",
    "ATS-optimized formatting",
    "Professional PDF downloads",
    "Lifetime access - no recurring fees",
    "Priority support",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-slate-900">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            You've used your free trial. Unlock unlimited access to beat ATS systems and land your dream job.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6 dark:border-slate-800 dark:from-blue-950/20 dark:to-slate-900">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                ₹299
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                One-time payment • Lifetime access
              </div>
            </div>
          </div>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-800"
            size="lg"
          >
            Upgrade Now - ₹299
          </Button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Secure payment via Razorpay • UPI, Cards, Net Banking supported
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
