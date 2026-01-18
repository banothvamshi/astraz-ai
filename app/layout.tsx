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

export const metadata: Metadata = {
  title: "Astraz AI - Beat ATS with AI-Powered Resumes | Premium Resume Generator",
  description: "Generate ATS-optimized resumes and cover letters that pass Applicant Tracking Systems. Upload your resume, paste the job description, and get perfectly tailored application materials. Professional quality, better than paid services.",
  keywords: "ATS resume builder, resume optimizer, cover letter generator, ATS-friendly resume, job application, resume writer, AI resume builder, professional resume, resume generator",
  authors: [{ name: "Astraz AI" }],
  creator: "Astraz AI",
  publisher: "Astraz AI",
  openGraph: {
    title: "Astraz AI - Beat ATS with AI-Powered Resumes",
    description: "Generate ATS-optimized resumes and cover letters that pass Applicant Tracking Systems",
    url: "https://astrazai.com",
    siteName: "Astraz AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astraz AI - Beat ATS with AI-Powered Resumes",
    description: "Generate ATS-optimized resumes and cover letters",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
