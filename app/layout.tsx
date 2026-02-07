import { Suspense } from "react";
import type { Metadata } from "next";


import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Comprehensive SEO keywords for job search/resume builder ranking
const seoKeywords = [
  // BRAND & CORE
  "Astraz AI", "Astraz", "Astra AI", "Astrazai", "Astraz.ai",

  // HIGH VOLUME - BROAD
  "resume builder", "free resume builder", "online resume builder", "resume maker", "cv maker",
  "resume generator", "cv generator", "biodata maker", "curriculum vitae creator",

  // AI SPECIFIC
  "ai resume builder", "best ai resume builder", "ai resume generator", "chatgpt resume builder",
  "ai cv maker", "ai powered resume", "automated resume builder", "gemini resume builder",

  // ATS SPECIFIC (High Value)
  "ats resume", "ats friendly resume", "ats resume checker", "ats resume builder",
  "ats scanner", "ats score", "ats compliant resume", "resume for ats systems",

  // FEATURE SPECIFIC
  "free resume download", "pdf resume builder", "resume templates", "professional resume templates",
  "no sign up resume builder", "instant resume download", "resume format 2026",

  // TARGET AUDIENCE
  "resume for students", "resume for freshers", "software engineer resume", "tech resume",
  "manager resume", "executive resume", "career change resume",

  // COMPETITOR ALTERNATIVES
  "best canva alternative", "novoresume alternative", "zety alternative", "resume.io alternative",
  "better than chatgpt for resumes", "best free resume builder 2026"
].join(", ");

export const metadata: Metadata = {
  metadataBase: new URL("https://www.astrazai.com"),
  title: {
    default: "Best Free AI Resume Builder & Generator 2026 | Astraz AI (ATS Friendly)",
    template: "%s | Astraz AI - #1 ATS Resume Builder"
  },
  description: "Ranked #1 Free AI Resume Builder. Create a perfect ATS-friendly resume in seconds. No sign-up required. Instant PDF Download. Better than Canva & Novoresume.",
  keywords: seoKeywords,
  authors: [{ name: "Astraz AI", url: "https://www.astrazai.com" }],
  creator: "Astraz AI",
  publisher: "Astraz AI",
  applicationName: "Astraz AI Resume Generator",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Career & Employment",
  classification: "Free Resume Builder, CV Maker, AI Career Tools",
  formatDetection: {
    telephone: false,
  },

  openGraph: {
    title: "Best Free AI Resume Builder 2026 | Astraz AI (100% Free PDF)",
    description: "Don't pay for a resume. Use Astraz AI to build a professional, ATS-optimized CV in seconds. Download PDF for free. No credit card required.",
    url: "https://www.astrazai.com",
    siteName: "Astraz AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Best Free AI Resume Builder 2026 | Astraz AI"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Free AI Resume Builder | Astraz AI",
    description: "Stop paying for resumes. Create a job-winning CV for free with Astraz AI. ATS-friendly & Instant Download.",
    images: ["/twitter-image.png"],
    creator: "@astrazai"
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "./",
    languages: {
      "en-US": "/en-US",
      "en-IN": "/en-IN",
    }
  },

  verification: {
    google: "rDPoz0SsOONDkX6V7zZ5qULymzB7X8mKMQbJWM9A9vA",
  },

  icons: {
    icon: [
      { url: "https://www.astrazai.com/favicon.ico", sizes: "any" },
      { url: "https://www.astrazai.com/logo.png", type: "image/png" }
    ],
    shortcut: "https://www.astrazai.com/favicon.ico",
    apple: "https://www.astrazai.com/logo.png",
  }
};

// JSON-LD Structured Data for rich snippets
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.astrazai.com/#website",
      "url": "https://www.astrazai.com",
      "name": "Astraz AI Resume Builder",
      "description": "The #1 AI-Powered ATS Resume Builder & Generator",
      "publisher": { "@id": "https://www.astrazai.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.astrazai.com/dashboard?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://www.astrazai.com/#navigation",
      "name": ["Home", "Login", "Pricing", "Terms"],
      "url": [
        "https://www.astrazai.com",
        "https://www.astrazai.com/login",
        "https://www.astrazai.com/payment",
        "https://www.astrazai.com/terms"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://www.astrazai.com/#organization",
      "name": "Astraz AI",
      "url": "https://www.astrazai.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.astrazai.com/logo.png",
        "width": 512,
        "height": 512,
        "caption": "Astraz AI Logo"
      },
      "sameAs": [
        "https://twitter.com/astrazai",
        "https://linkedin.com/company/astrazai",
        "https://facebook.com/astrazai",
        "https://instagram.com/astrazai"
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": "Astraz AI Resume Builder",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "12847",
        "bestRating": "5",
        "worstRating": "1"
      },
      "description": "Create ATS-optimized resumes with AI. Free resume builder that passes 99% of Applicant Tracking Systems. Instant PDF download.",
      "featureList": [
        "AI-powered resume optimization",
        "ATS compatibility scoring",
        "Instant PDF download",
        "Job description analysis",
        "Keyword optimization",
        "Professional resume templates",
        "Cover letter generator",
        "LinkedIn profile optimizer"
      ],
      "screenshot": "https://www.astrazai.com/og-image.png",
      "softwareHelp": "https://www.astrazai.com/about"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the best free AI resume builder?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Astraz AI is widely considered the best free AI resume builder because it offers professional ATS-friendly templates, AI content optimization, and instant PDF downloads without forced watermarks or paywalls for the first resume."
          }
        },
        {
          "@type": "Question",
          "name": "Is Astraz AI really free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Astraz AI allows you to build and download a professional resume for free. We also offer premium features for power users who need unlimited generations and advanced AI analysis."
          }
        },
        {
          "@type": "Question",
          "name": "Does Astraz AI work with ATS systems?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Astraz AI is specifically engineered to pass Applicant Tracking Systems (ATS). Our templates use clean, parseable formatting and our AI inserts the exact keywords needed to rank high in recruiter searches."
          }
        }
      ]
    }
  ]
};

import { AnalyticsTracker } from "@/components/analytics-tracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
