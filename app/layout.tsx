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
  // User Requested High-Value Keywords
  "best resume builder",
  "best resume generator",
  "best resume creator",
  "best ats resume",
  "best ats resume builder",
  "best ats resume creator",
  "best ats resume generator",
  "free ats resume generator",
  "free ats resume builder",
  "free ats resume creator",

  // General
  "resume", "CV", "curriculum vitae", "biodata", "job search", "cv maker",
  "free resume pdf", "download resume", "make resume online",
  "resume builder 2026", "ai resume builder", "chatgpt resume",

  // Competitor Alternatives
  "canva alternative", "novoresume alternative", "zety alternative", "resume.io alternative",

  // Specific
  "resume for students", "resume for freshers", "resume for experienced", "tech resume", "software engineer resume"
].join(", ");

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: {
    default: "Best Free AI Resume Builder | Astraz AI (100% Free PDF Download)",
    template: "%s | Astraz AI"
  },
  description: "Rank #1 Free AI Resume Builder 2026. Create ATS-friendly resumes in minutes. No sign-up required for trial. Better than Canva, Resumeworded & Novoresume. Instant PDF Download.",
  keywords: seoKeywords,
  authors: [{ name: "Astraz AI", url: "https://astrazai.com" }],
  creator: "Astraz AI",
  publisher: "Astraz AI",
  applicationName: "Astraz AI CV Maker",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Career & Employment",
  classification: "Free Resume Builder, CV Maker",
  formatDetection: {
    telephone: false,
  },

  openGraph: {
    title: "Best Free AI Resume Builder | Pass ATS Scanners (100% Free)",
    description: "Don't pay for a resume. Use Astraz AI to build a professional, ATS-optimized CV in seconds. Download PDF for free. No credit card required.",
    url: "https://astrazai.com",
    siteName: "Astraz AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://astrazai.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Best Free AI Resume Builder 2026"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: "Best Free AI Resume Builder | Astraz AI",
    description: "Stop paying for resumes. Create a job-winning CV for free with Astraz AI. ATS-friendly & Instant Download.",
    images: ["https://astrazai.com/twitter-image.png"],
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
    canonical: "https://astrazai.com",
    languages: {
      "en-US": "https://astrazai.com",
      "en-IN": "https://astrazai.com",
    }
  },

  verification: {
    google: "rDPoz0SsOONDkX6V7zZ5qULymzB7X8mKMQbJWM9A9vA",
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  }
};

// JSON-LD Structured Data for rich snippets
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://astrazai.com/#website",
      "url": "https://astrazai.com",
      "name": "Astraz AI",
      "description": "AI-Powered ATS Resume Builder",
      "publisher": { "@id": "https://astrazai.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://astrazai.com/dashboard?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://astrazai.com/#organization",
      "name": "Astraz AI",
      "url": "https://astrazai.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://astrazai.com/logo.png",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "https://twitter.com/astrazai",
        "https://linkedin.com/company/astrazai"
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": "Astraz AI Resume Builder",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "12847",
        "bestRating": "5",
        "worstRating": "1"
      },
      "description": "Create ATS-optimized resumes with AI. Free resume builder that passes 99% of Applicant Tracking Systems.",
      "featureList": [
        "AI-powered resume optimization",
        "ATS compatibility scoring",
        "Instant PDF download",
        "Job description analysis",
        "Keyword optimization",
        "Professional templates"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is Astraz AI really free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Astraz AI offers a free tier that allows you to create one optimized resume. Premium plans unlock unlimited generations."
          }
        },
        {
          "@type": "Question",
          "name": "What is an ATS resume?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "An ATS resume is optimized to pass Applicant Tracking Systems - software used by 99% of Fortune 500 companies to filter resumes before human review."
          }
        },
        {
          "@type": "Question",
          "name": "How does Astraz AI optimize my resume?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Astraz AI analyzes the job description, extracts key requirements, and rewrites your resume to match those requirements while maintaining your authentic experience."
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
        <AnalyticsTracker />
      </body>
    </html>
  );
}
