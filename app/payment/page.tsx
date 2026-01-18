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

  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      setPaymentSuccess(true);
    }
  }, [searchParams]);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Create order
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 29900, // ₹299 in paise
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const { orderId, amount, currency } = await response.json();

      // Wait for Razorpay to be loaded
      if (!window.Razorpay) {
        alert("Payment gateway is loading. Please try again in a moment.");
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: amount,
        currency: currency,
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
          <div className="mx-auto max-w-md">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                Upgrade to Premium
              </h1>
              <p className="mb-6 text-slate-600 dark:text-slate-400">
                Get lifetime access to unlimited resume and cover letter generations.
              </p>

              <div className="mb-6 rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6 dark:border-slate-800 dark:from-blue-950/20 dark:to-slate-900">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                    ₹299
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    One-time payment • Lifetime access
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-800"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay ₹299"
                )}
              </Button>

              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Secure payment via Razorpay • UPI, Cards, Net Banking supported
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
