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
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Button onClick={() => router.push("/")} variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setCurrency("INR")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${currency === "INR"
                  ? "bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                🇮🇳 INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${currency === "USD"
                  ? "bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                🌍 USD
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-50 mb-5">
                Choose Your <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Plan</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Invest in your career. Get AI-powered resume optimization.
              </p>
            </div>

            {/* Promo Code Input */}
            <div className="max-w-md mx-auto mb-16">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Have a promo code?"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-900"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button
                  onClick={validateCoupon}
                  disabled={isValidatingCoupon || !promoCode}
                  className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6 h-auto"
                >
                  {isValidatingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : "Apply"}
                </Button>
              </div>
              {couponError && <p className="text-red-500 text-sm mt-2 text-center">{couponError}</p>}
              {appliedCoupon && (
                <div className="mt-2 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2">
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Code <span className="uppercase">{appliedCoupon.code}</span> applied:
                    {appliedCoupon.discount_type === 'percent' ? ` ${appliedCoupon.discount_value}% OFF` : ` Flat ${appliedCoupon.discount_value} OFF`}
                  </p>
                </div>
              )}
            </div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {/* Starter Plan */}
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-shadow dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">{PLANS.starter.name}</h3>
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
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("starter", prices[currency].starter.value)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-12 mt-auto text-base font-semibold"
                >
                  {isProcessing && selectedPlan === "starter" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Starter"}
                </Button>
              </div>

              {/* Professional Plan */}
              <div className="flex flex-col relative rounded-2xl border-2 border-amber-500 bg-white p-8 shadow-xl dark:bg-slate-900 transition-transform hover:scale-[1.02]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 px-5 py-1.5 text-sm font-semibold text-white shadow-lg">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 mt-2">{PLANS.professional.name}</h3>
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
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("professional", prices[currency].professional.value)}
                  disabled={isProcessing}
                  className="w-full h-12 mt-auto bg-amber-600 hover:bg-amber-700 text-base font-semibold"
                >
                  {isProcessing && selectedPlan === "professional" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Professional"}
                </Button>
              </div>

              {/* Enterprise Plan */}
              <div className="flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-xl text-white">
                <h3 className="text-xl font-bold mb-2">{PLANS.enterprise.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{PLANS.enterprise.tagline}</p>
                <div className="mb-8">
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
                <ul className="space-y-4 mb-8 flex-grow">
                  {PLANS.enterprise.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePayment("enterprise", prices[currency].enterprise.value)}
                  disabled={isProcessing}
                  className="w-full h-12 mt-auto bg-white text-slate-900 hover:bg-slate-100 text-base font-semibold"
                >
                  {isProcessing && selectedPlan === "enterprise" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Get Enterprise"}
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Secure payment via Razorpay • UPI, Cards, Net Banking supported
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
