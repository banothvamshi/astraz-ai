"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap } from "lucide-react";
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

  const plans = [
    {
      key: "starter",
      name: "Starter",
      featured: false,
      features: ["10 Generations/mo", "PDF Downloads", "Basic Templates"],
    },
    {
      key: "professional",
      name: "Professional",
      featured: true,
      features: ["30 Generations/mo", "Premium Templates", "Cover Letters", "Priority Support"],
    },
    {
      key: "enterprise",
      name: "Enterprise",
      featured: false,
      dark: true,
      features: ["100 Generations/mo", "All Premium Features", "Priority Support", "Early Access"],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-8 py-8 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-3xl font-bold">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-center text-amber-100 text-base">
            Unlock premium features to land your dream job
          </DialogDescription>

          {/* Currency Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setCurrency("INR")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currency === "INR" ? "bg-white text-amber-600 shadow-md" : "text-white hover:bg-white/10"}`}
              >
                🇮🇳 INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currency === "USD" ? "bg-white text-amber-600 shadow-md" : "text-white hover:bg-white/10"}`}
              >
                🌍 USD
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Pricing Cards */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl p-6 transition-all ${plan.featured
                  ? "border-2 border-amber-500 bg-white dark:bg-slate-800 shadow-xl shadow-amber-500/20 scale-105"
                  : plan.dark
                    ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300"
                }`}
            >
              {/* Popular Badge */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                  MOST POPULAR
                </div>
              )}

              {/* Plan Name */}
              <h3 className={`font-bold text-lg mb-2 ${plan.dark ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {plan.name}
              </h3>

              {/* Price */}
              <div className={`text-3xl font-extrabold mb-4 ${plan.featured ? "text-amber-600" : plan.dark ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {prices[currency][plan.key as keyof typeof prices.INR]}
                <span className={`text-sm font-normal ${plan.dark ? "text-slate-400" : "text-slate-500"}`}>/mo</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className={`flex items-center gap-2.5 text-sm ${plan.dark ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>
                    {plan.dark ? (
                      <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    )}
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <Button
                onClick={() => handlePlanSelect(plan.key)}
                className={`w-full h-12 font-semibold rounded-xl transition-all ${plan.featured
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25"
                    : plan.dark
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "border-2 border-slate-300 bg-transparent text-slate-700 hover:border-amber-500 hover:text-amber-600 dark:border-slate-600 dark:text-slate-300"
                  }`}
                variant={plan.featured ? "default" : "outline"}
              >
                Get {plan.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 pb-6 bg-slate-50 dark:bg-slate-900">
          🔒 Secure payment via Razorpay • UPI, Cards, Net Banking
        </p>
      </DialogContent>
    </Dialog>
  );
}
