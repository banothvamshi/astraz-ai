"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Plan definitions with credits
const PLANS = {
  basic: {
    name: "Basic",
    credits: 5,
    tagline: "Perfect for quick job applications",
    features: ["5 Resume Generations", "ATS Optimization", "PDF Export", "Email Support"]
  },
  pro: {
    name: "Pro",
    credits: 25,
    tagline: "Best value for active job seekers",
    features: ["25 Resume Generations", "ATS Optimization", "Premium Templates", "Priority Processing", "Email Support"],
    popular: true
  },
  unlimited: {
    name: "Unlimited",
    credits: -1, // -1 means unlimited
    tagline: "For career professionals",
    features: ["Unlimited Generations", "All Premium Templates", "Priority Support", "Lifetime Access"]
  }
};

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  useEffect(() => {
    const success = searchParams.get("success");
    const currencyParam = searchParams.get("currency");
    if (success === "true") {
      setPaymentSuccess(true);
    }
    if (currencyParam === "USD") {
      setCurrency("USD");
    }
  }, [searchParams]);

  const prices = {
    INR: {
      basic: { display: "₹99", value: 9900 },
      pro: { display: "₹299", value: 29900 },
      unlimited: { display: "₹499", value: 49900 }
    },
    USD: {
      basic: { display: "$4.99", value: 499 },
      pro: { display: "$9.99", value: 999 },
      unlimited: { display: "$19.99", value: 1999 }
    }
  };

  const handlePayment = async (planKey: string, amount: number) => {
    setIsProcessing(true);
    setSelectedPlan(planKey);

    try {
      const plan = PLANS[planKey as keyof typeof PLANS];

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          plan_type: planKey,
          credits: plan.credits
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const { orderId, amount: orderAmount, currency: orderCurrency } = await response.json();

      if (!window.Razorpay) {
        alert("Payment gateway is loading. Please try again in a moment.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderAmount,
        currency: orderCurrency,
        name: "Astraz AI",
        description: `${plan.name} Plan - ${plan.credits === -1 ? 'Unlimited' : plan.credits} Resume Generations`,
        order_id: orderId,
        handler: async function (response: any) {
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planKey,
              credits: plan.credits,
              amount: amount,
              currency: currency
            }),
          });

          if (verifyResponse.ok) {
            localStorage.setItem("astraz_premium", "true");
            localStorage.setItem("astraz_plan", planKey);
            localStorage.setItem("astraz_credits", String(plan.credits));
            router.push("/dashboard?premium=true");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: { email: "", contact: "" },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setSelectedPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong. Please try again.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
            Payment Successful! 🎉
          </h1>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Your premium access has been activated. Start optimizing your resumes now!
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Button onClick={() => router.push("/")} variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setCurrency("INR")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${currency === "INR"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                🇮🇳 INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${currency === "USD"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                🌍 USD
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
                Choose Your Plan
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Invest in your career. Get AI-powered resume optimization.
              </p>
            </div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">{PLANS.basic.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{PLANS.basic.tagline}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                    {prices[currency].basic.display}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">/one-time</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {PLANS.basic.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("basic", prices[currency].basic.value)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-11"
                >
                  {isProcessing && selectedPlan === "basic" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Basic"}
                </Button>
              </div>

              {/* Pro Plan */}
              <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-xl dark:bg-slate-900">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">{PLANS.pro.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{PLANS.pro.tagline}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-indigo-600">
                    {prices[currency].pro.display}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">/one-time</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {PLANS.pro.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("pro", prices[currency].pro.value)}
                  disabled={isProcessing}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing && selectedPlan === "pro" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Pro"}
                </Button>
              </div>

              {/* Unlimited Plan */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-xl text-white">
                <h3 className="text-xl font-bold mb-1">{PLANS.unlimited.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{PLANS.unlimited.tagline}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {prices[currency].unlimited.display}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">/lifetime</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {PLANS.unlimited.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("unlimited", prices[currency].unlimited.value)}
                  disabled={isProcessing}
                  className="w-full h-11 bg-white text-slate-900 hover:bg-slate-100"
                >
                  {isProcessing && selectedPlan === "unlimited" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Go Unlimited"}
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Secure payment via Razorpay • UPI, Cards, Net Banking supported
              </p>
              <p className="mt-2 text-xs text-slate-400">
                All plans include instant access. No recurring charges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
