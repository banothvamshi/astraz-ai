"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, ArrowLeft, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Plan definitions with monthly subscription credits
const PLANS = {
  starter: {
    name: "Starter",
    credits: 10,
    tagline: "For active job seekers",
    features: ["10 Generations/month", "ATS Optimization", "PDF Export", "Email Support"],
    billing: "monthly"
  },
  professional: {
    name: "Professional",
    credits: 30,
    tagline: "Best value for serious applicants",
    features: ["30 Generations/month", "ATS Optimization", "Priority Processing", "Cover Letters"],
    popular: true,
    billing: "monthly"
  },
  enterprise: {
    name: "Enterprise",
    credits: 100,
    tagline: "For career professionals & recruiters",
    features: ["100 Generations/month", "Cover Letters", "All Premium Features", "Priority Support", "Early Access"],
    billing: "monthly"
  }
};

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

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
      starter: { display: "₹199", value: 19900 },
      professional: { display: "₹499", value: 49900 },
      enterprise: { display: "₹999", value: 99900 }
    },
    USD: {
      starter: { display: "$4.99", value: 499 },
      professional: { display: "$9.99", value: 999 },
      enterprise: { display: "$19.99", value: 1999 }
    }
  };

  const validateCoupon = async () => {
    if (!promoCode) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon(data);
      } else {
        setCouponError(data.message || "Invalid coupon");
      }
    } catch (error) {
      setCouponError("Failed to validate");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getDiscountedPrice = (planValue: number) => {
    if (!appliedCoupon) return null;
    let final = planValue;
    if (appliedCoupon.discount_type === 'percent') {
      const discount = Math.floor(planValue * (appliedCoupon.discount_value / 100));
      final = Math.max(0, planValue - discount);
    } else {
      // Flat discount stored in major units, convert to cents/paise (x100)
      const discount = appliedCoupon.discount_value * 100;
      final = Math.max(0, planValue - discount);
    }
    return final;
  };

  const formatPrice = (value: number) => {
    return currency === "INR" ? `₹${(value / 100)}` : `$${(value / 100)}`;
  };

  const handlePayment = async (planKey: string, amount: number) => {
    setIsProcessing(true);
    setSelectedPlan(planKey);

    try {
      const plan = PLANS[planKey as keyof typeof PLANS];

      // If coupon applied, use original amount for reference but send coupon code
      // The API will calculate the final discounted amount.
      // But for verify step, we need to know what we expect.

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount, // Send original amount, let server apply discount
          currency: currency,
          plan_type: planKey,
          credits: plan.credits,
          coupon_code: appliedCoupon?.code
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
        description: `${plan.name} Plan ${appliedCoupon ? `(Coupon: ${appliedCoupon.code})` : ''}`,
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
              amount: orderAmount, // Verify with ACTUAL paid amount
              currency: currency,
              coupon_applied: appliedCoupon?.code // For tracking usage
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
        theme: { color: "#d97706" }, // Amber-600
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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black px-4 relative overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl p-8 shadow-xl text-center dark:border-slate-800 dark:bg-slate-900/50 relative z-10">
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
            className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25"
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
      <div className="min-h-screen bg-white dark:bg-black selection:bg-amber-500/30">
        <FloatingNav />
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

        <div className="container mx-auto px-4 py-32 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="text-center mb-16">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white mb-6"
              >
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Plan</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
              >
                Invest in your career with our AI-powered premium features. Uncover the hidden potential of your experience.
              </motion.p>

              {/* Currency Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex justify-center"
              >
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                  <button
                    onClick={() => setCurrency("INR")}
                    className={`flex items-center gap-1.5 rounded-full px-6 py-2 text-sm font-semibold transition-all ${currency === "INR"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                  >
                    🇮🇳 INR
                  </button>
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`flex items-center gap-1.5 rounded-full px-6 py-2 text-sm font-semibold transition-all ${currency === "USD"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                  >
                    🌍 USD
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Promo Code Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md mx-auto mb-20"
            >
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  placeholder="Have a promo code?"
                  className="flex-1 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white transition-all"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button
                  onClick={validateCoupon}
                  disabled={isValidatingCoupon || !promoCode}
                  className="bg-slate-900 dark:bg-white dark:text-black text-white hover:opacity-90 rounded-xl px-6 h-auto transition-all"
                >
                  {isValidatingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : "Apply"}
                </Button>
              </div>
              {couponError && <p className="text-red-500 text-sm mt-2 text-center">{couponError}</p>}
              {appliedCoupon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2"
                >
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Code <span className="uppercase tracking-wider">{appliedCoupon.code}</span> applied:
                    {appliedCoupon.discount_type === 'percent' ? ` ${appliedCoupon.discount_value}% OFF` : ` Flat ${appliedCoupon.discount_value} OFF`}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -8 }}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-sm p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none"
              >
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">{PLANS.starter.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{PLANS.starter.tagline}</p>
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    {appliedCoupon ? (
                      <>
                        <span className="text-xl text-slate-400 line-through decoration-slate-400">{prices[currency].starter.display}</span>
                        <span className="text-5xl font-bold text-amber-600">
                          {formatPrice(getDiscountedPrice(prices[currency].starter.value)!)}
                        </span>
                      </>
                    ) : (
                      <span className="text-5xl font-bold text-slate-900 dark:text-slate-50">
                        {prices[currency].starter.display}
                      </span>
                    )}
                    <span className="text-base text-slate-500">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {PLANS.starter.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("starter", prices[currency].starter.value)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-14 mt-auto text-base font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  {isProcessing && selectedPlan === "starter" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Starter"}
                </Button>
              </motion.div>

              {/* Professional Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -8 }}
                className="flex flex-col relative rounded-3xl border-2 border-amber-500 bg-white p-8 shadow-2xl shadow-amber-500/10 dark:bg-slate-900 transition-all z-10"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/30">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2 mt-2">{PLANS.professional.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{PLANS.professional.tagline}</p>
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    {appliedCoupon ? (
                      <>
                        <span className="text-xl text-slate-400 line-through decoration-slate-400">{prices[currency].professional.display}</span>
                        <span className="text-5xl font-bold text-amber-600">
                          {formatPrice(getDiscountedPrice(prices[currency].professional.value)!)}
                        </span>
                      </>
                    ) : (
                      <span className="text-5xl font-bold text-amber-600">
                        {prices[currency].professional.display}
                      </span>
                    )}
                    <span className="text-base text-slate-500">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {PLANS.professional.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("professional", prices[currency].professional.value)}
                  disabled={isProcessing}
                  className="w-full h-14 mt-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-base font-semibold shadow-lg shadow-amber-500/25 rounded-xl"
                >
                  {isProcessing && selectedPlan === "professional" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Professional"}
                </Button>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -8 }}
                className="flex flex-col rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-xl text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <h3 className="text-2xl font-bold mb-2 relative z-10">{PLANS.enterprise.name}</h3>
                <p className="text-sm text-slate-400 mb-6 relative z-10">{PLANS.enterprise.tagline}</p>
                <div className="mb-8 relative z-10">
                  <div className="flex items-baseline gap-2">
                    {appliedCoupon ? (
                      <>
                        <span className="text-xl text-slate-500 line-through decoration-slate-500">{prices[currency].enterprise.display}</span>
                        <span className="text-5xl font-bold">
                          {formatPrice(getDiscountedPrice(prices[currency].enterprise.value)!)}
                        </span>
                      </>
                    ) : (
                      <span className="text-5xl font-bold">
                        {prices[currency].enterprise.display}
                      </span>
                    )}
                    <span className="text-base text-slate-400">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow relative z-10">
                  {PLANS.enterprise.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="h-5 w-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("enterprise", prices[currency].enterprise.value)}
                  disabled={isProcessing}
                  className="w-full h-14 mt-auto bg-white text-slate-900 hover:bg-slate-100 text-base font-semibold rounded-xl relative z-10"
                >
                  {isProcessing && selectedPlan === "enterprise" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Enterprise"}
                </Button>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="mt-20 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Secure payment via Razorpay • UPI, Cards, Net Banking supported
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Monthly subscription • Cancel anytime • Instant access
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
