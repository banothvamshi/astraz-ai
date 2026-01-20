import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  // Primary keywords
  "ATS resume builder",
  "ATS resume optimizer",
  "AI resume builder",
  "resume generator",
  "free resume builder",

  // Long-tail keywords
  "ATS friendly resume",
  "ATS optimized resume",
  "resume for job application",
  "professional resume maker",
  "best resume builder 2025",
  "resume builder online free",
  "AI powered resume",
  "resume builder with AI",

  // Alternative searches
  "resume maker",
  "CV builder",
  "CV generator",
  "resume creator",
  "job resume builder",
  "career resume builder",

  // Competitor alternatives
  "resumeworded alternative",
  "jobscan alternative",
  "resume.io alternative",
  "zety alternative",
  "novoresume alternative",
  "canva resume alternative",
  "indeed resume builder alternative",
  "linkedin resume builder alternative",

  // Feature-based
  "ATS score checker",
  "resume keyword optimizer",
  "resume parser",
  "job description analyzer",
  "resume tailoring tool",
  "resume customization AI",

  // Industry specific
  "tech resume builder",
  "IT resume generator",
  "software engineer resume",
  "data scientist resume",
  "marketing resume builder",
  "sales resume generator",
  "fresher resume builder",
  "experienced professional resume",

  // Location-based
  "resume builder India",
  "resume builder USA",
  "resume builder free India",
  "international resume builder"
].join(", ");

export const metadata: Metadata = {
  title: {
    default: "Astraz AI - #1 Free ATS Resume Builder | AI-Powered Resume Generator",
    template: "%s | Astraz AI"
  },
  description: "Create ATS-optimized resumes that pass 99% of Applicant Tracking Systems. Free AI resume builder with instant PDF download. Better than Resumeworded, Jobscan, and Resume.io. Used by 50,000+ job seekers worldwide.",
  keywords: seoKeywords,
  authors: [{ name: "Astraz AI", url: "https://astrazai.com" }],
  creator: "Astraz AI",
  publisher: "Astraz AI",
  applicationName: "Astraz AI Resume Builder",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Technology",
  classification: "Resume Builder, Career Tools",

  openGraph: {
    title: "Astraz AI - #1 Free ATS Resume Builder | Pass 99% of ATS Systems",
    description: "Create ATS-optimized resumes in seconds. Free AI-powered resume builder trusted by 50,000+ job seekers. Better than paid alternatives.",
    url: "https://astrazai.com",
    siteName: "Astraz AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://astrazai.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Astraz AI - Free ATS Resume Builder"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: "Astraz AI - #1 Free ATS Resume Builder",
    description: "Create ATS-optimized resumes that pass 99% of screening systems. Free AI-powered, instant PDF download.",
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
    // yandex: "your-yandex-code",
    // bing: "your-bing-code",
  },

  other: {
    "msapplication-TileColor": "#6366f1",
    "theme-color": "#6366f1",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://astrazai.com" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
