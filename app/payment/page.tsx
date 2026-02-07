import type { Metadata } from "next";
import { PaymentContent } from "@/components/payment/payment-content";

export const metadata: Metadata = {
  title: "Plans & Pricing | Astraz AI - Invest in Your Career",
  description: "Affordable premium plans for Astraz AI. Get unlimited resume generations, ATS optimization, and cover letter builder. Start for free.",
  alternates: {
    canonical: "https://www.astrazai.com/payment",
  },
};

export default function PaymentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.astrazai.com"
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": "Pricing",
      "item": "https://www.astrazai.com/payment"
    }]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PaymentContent />
    </>
  );
}
