"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
    INR: { basic: "₹99", pro: "₹299", unlimited: "₹499", basicVal: 9900, proVal: 29900, unlimitedVal: 49900 },
    USD: { basic: "$4.99", pro: "$9.99", unlimited: "$19.99", basicVal: 499, proVal: 999, unlimitedVal: 1999 }
  };

  const handlePayment = async (amount: number = 29900) => {
    setIsProcessing(true);

    try {
      // Create order
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const { orderId, amount: orderAmount, currency: orderCurrency } = await response.json();

      // Wait for Razorpay to be loaded
      if (!window.Razorpay) {
        alert("Payment gateway is loading. Please try again in a moment.");
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderAmount,
        currency: orderCurrency,
        name: "Astraz AI",
        description: "Lifetime Premium Access",
        order_id: orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyResponse.ok) {
            // Mark user as premium (you can use localStorage or Supabase)
            localStorage.setItem("astraz_premium", "true");
            router.push("/dashboard?premium=true");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: {
          email: "",
          contact: "",
        },
        theme: {
          color: "#1e293b",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
            Payment Successful!
          </h1>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Your premium access has been activated. You can now generate unlimited resumes and cover letters.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-800"
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
        onLoad={() => {
          console.log("Razorpay loaded");
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
                Choose Your Plan
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Invest in your career. Get unlimited access to AI-powered resume optimization.
              </p>
            </div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Basic</h3>
                <p className="text-sm text-slate-500 mb-4">Perfect for quick job applications</p>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                  {prices[currency].basic} <span className="text-sm font-normal text-slate-500">/one-time</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> 3 Resume Generations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> 3 Cover Letters
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> PDF Export
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment(prices[currency].basicVal)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  Get Started
                </Button>
              </div>

              {/* Pro Plan - Recommended */}
              <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-xl dark:bg-slate-900">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  MOST POPULAR
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Pro</h3>
                <p className="text-sm text-slate-500 mb-4">Best value for active job seekers</p>
                <div className="text-3xl font-bold text-indigo-600 mb-6">
                  {prices[currency].pro} <span className="text-sm font-normal text-slate-500">/one-time</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> 25 Resume Generations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> 25 Cover Letters
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> Premium Templates
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500" /> Priority Processing
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment(prices[currency].proVal)}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Get Pro"}
                </Button>
              </div>

              {/* Unlimited Plan */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-sm text-white">
                <h3 className="text-lg font-semibold mb-2">Unlimited</h3>
                <p className="text-sm text-slate-400 mb-4">For career professionals</p>
                <div className="text-3xl font-bold mb-6">
                  {prices[currency].unlimited} <span className="text-sm font-normal text-slate-400">/lifetime</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400" /> Unlimited Generations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400" /> All Premium Templates
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400" /> LinkedIn Optimization
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400" /> Priority Support
                  </li>
                </ul>
                <Button
                  onClick={() => handlePayment(prices[currency].unlimitedVal)}
                  disabled={isProcessing}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100"
                >
                  Go Unlimited
                </Button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Secure payment via Razorpay • UPI, Cards, Net Banking supported
            </p>
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
