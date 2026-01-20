"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Download, Sparkles, ArrowLeft, Edit2, UploadCloud, Briefcase, ChevronDown, ChevronUp, User, Mail, Phone, Linkedin, MapPin, Building2, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadArea } from "@/components/upload-area";
import { PaywallModal } from "@/components/paywall-modal";
import { ResumeEditor } from "@/components/resume-editor";
import { canUseFreeTrial, markTrialUsed, hasUsedTrial } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/auth";

interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
}

interface JobDetails {
  companyName: string;
  jobTitle: string;
  location: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeMeta, setResumeMeta] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [canTrial, setCanTrial] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Credits system states
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // History states
  const [payments, setPayments] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // New: Contact info state
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    location: "",
  });
  const [showContactInfo, setShowContactInfo] = useState(false);

  // New: Job details state
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    companyName: "",
    jobTitle: "",
    location: "",
  });

  // Sync activeTab with URL params (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      setCanTrial(canUseFreeTrial());
      setIsPremium(localStorage.getItem("astraz_premium") === "true");

      // Check URL params for premium status
      const params = new URLSearchParams(window.location.search);
      if (params.get("premium") === "true") {
        setIsPremium(true);
        localStorage.setItem("astraz_premium", "true");
      }

      // Fetch user profile and credits from Supabase
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, is_premium, credits_remaining, total_generations, free_generations_used")
          .eq("id", user.id)
          .single();

        if (profile) {
          // Redirect admins to admin panel
          if (profile.is_admin) {
            router.push("/admin");
            return;
          }

          setIsPremium(profile.is_premium || false);
          setCreditsRemaining(profile.credits_remaining ?? 0);
          setTotalGenerations(profile.total_generations || 0);

          // Access control: Check if user can access dashboard
          const hasUnusedTrial = (profile.free_generations_used || 0) === 0;
          const hasCredits = (profile.credits_remaining || 0) > 0 || profile.credits_remaining === -1;

          if (!profile.is_premium && !hasUnusedTrial && !hasCredits) {
            // No access - redirect to payment
            router.push("/payment");
            return;
          }
        }

        // Fetch History Data
        setIsLoadingHistory(true);

        // 1. Payments
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (paymentsData) setPayments(paymentsData);

        // 2. Generations
        const { data: generationsData } = await supabase
          .from("generations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (generationsData) setGenerations(generationsData);

        setIsLoadingHistory(false);
      }

      setIsLoadingProfile(false);
    };

    initDashboard();
  }, [router]);

  // Update contact info from parsed resume meta
  useEffect(() => {
    if (resumeMeta) {
      setContactInfo(prev => ({
        fullName: resumeMeta.name || prev.fullName,
        email: resumeMeta.email || prev.email,
        phone: resumeMeta.phone || prev.phone,
        linkedin: resumeMeta.linkedin || prev.linkedin,
        location: resumeMeta.location || prev.location,
      }));
    }
  }, [resumeMeta]);

  const handleGenerate = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      alert("Please upload a resume and paste the job description");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (resumeFile.size > maxSize) {
      alert(`File is too large (${(resumeFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
      return;
    }

    // Validate file type
    if (resumeFile.type !== "application/pdf") {
      alert("Please upload a PDF file. Other file types are not supported.");
      return;
    }

    if (jobDescription.trim().length < 100) {
      alert("Job description is too short. Please provide a complete job description (at least 100 characters).");
      return;
    }

    // Check if user is premium or can use free trial
    if (isPremium) {
      // Premium user, proceed
    } else if (!canTrial && hasUsedTrial()) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);

    try {
      // Convert PDF to base64
      const base64Resume = await fileToBase64(resumeFile);

      // Validate base64 conversion
      if (!base64Resume || base64Resume.length === 0) {
        throw new Error("Failed to process resume file. Please try uploading again.");
      }

      // Call API to generate
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: base64Resume,
          jobDescription,
          companyName: jobDetails.companyName.trim() || undefined,
          jobTitle: jobDetails.jobTitle.trim() || undefined,
          jobLocation: jobDetails.location.trim() || undefined,
          // Send contact overrides if user provided them
          contactOverrides: {
            fullName: contactInfo.fullName.trim() || undefined,
            email: contactInfo.email.trim() || undefined,
            phone: contactInfo.phone.trim() || undefined,
            linkedin: contactInfo.linkedin.trim() || undefined,
            location: contactInfo.location.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Generation failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setGeneratedResume(data.resume);
      setGeneratedCoverLetter(data.coverLetter);
      setResumeMeta(data.meta);

      // Auto-generate PDF preview
      if (data.resume) {
        generatePreviewPdf(data.resume, data.meta);
      }

      // Mark trial as used
      if (canTrial) {
        markTrialUsed();
        setCanTrial(false);
      }
    } catch (error: any) {
      console.error("Error generating:", error);
      const errorMessage = error.message || "Failed to generate. Please try again.";
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const generatePreviewPdf = async (resumeContent: string, meta: any) => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: resumeContent,
          type: "resume",
          name: contactInfo.fullName || meta?.name,
          email: contactInfo.email || meta?.email,
          phone: contactInfo.phone || meta?.phone,
          linkedin: contactInfo.linkedin || meta?.linkedin,
          location: contactInfo.location || meta?.location,
          company: jobDetails.companyName || undefined,
          jobTitle: jobDetails.jobTitle || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate preview");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error("Preview generation error:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownload = async (type: "resume" | "coverLetter") => {
    // Re-use preview URL if available and content matches (optimization)
    // For now, simple download logic is safer to ensure latest state
    const content = type === "resume" ? generatedResume : generatedCoverLetter;
    if (!content) return;

    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          type,
          name: contactInfo.fullName || resumeMeta?.name,
          email: contactInfo.email || resumeMeta?.email,
          phone: contactInfo.phone || resumeMeta?.phone,
          linkedin: contactInfo.linkedin || resumeMeta?.linkedin,
          location: contactInfo.location || resumeMeta?.location,
          company: jobDetails.companyName || undefined,
          jobTitle: jobDetails.jobTitle || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Generate a descriptive filename
      const timestamp = new Date().toISOString().split("T")[0];
      const userName = (contactInfo.fullName || resumeMeta?.name || "Resume")
        .replace(/[^a-zA-Z\s]/g, "")
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
      const targetJob = (jobDetails.jobTitle || "")
        .replace(/[^a-zA-Z\s]/g, "")
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("")
        .slice(0, 30);
      const targetCompany = (jobDetails.companyName || "")
        .replace(/[^a-zA-Z\s]/g, "")
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("")
        .slice(0, 20);

      // Format: Name_JobTitle_Company_Resume_Date.pdf or Name_Resume_Date.pdf
      const namePart = userName || "Resume";
      const jobPart = targetJob ? `_${targetJob}` : "";
      const companyPart = targetCompany ? `_${targetCompany}` : "";
      const docType = type === "resume" ? "Resume" : "CoverLetter";

      a.download = `${namePart}${jobPart}${companyPart}_${docType}_${timestamp}.pdf`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Download error:", error);
      alert(error.message || "Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">

      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-amber-100/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
            <img src="/logo.png" alt="Astraz AI" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Astraz AI
            </span>
          </div>

          {/* Generations Display */}
          {!isLoadingProfile && creditsRemaining !== null && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              {creditsRemaining === -1 ? (
                <>
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Unlimited Generations</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {creditsRemaining} {creditsRemaining === 1 ? 'generation' : 'generations'} left
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Upgrade Button for non-premium users */}
            {!isPremium && (
              <Button
                onClick={() => router.push("/payment")}
                className="hidden sm:flex bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            <Button
              onClick={() => router.push("/dashboard/debug-parser")}
              variant="ghost"
              className="hidden sm:flex text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
            >
              Debug Tools
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="mx-auto max-w-6xl">

          {/* New Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
            <button
              onClick={() => {
                setActiveTab("builder");
                router.push("/dashboard?tab=builder");
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "builder"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
            >
              Resume Builder
            </button>
            <button
              onClick={() => {
                setActiveTab("account");
                router.push("/dashboard?tab=account");
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "account"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
            >
              My Account
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                router.push("/dashboard?tab=history");
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "history"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
            >
              Generation History
            </button>
          </div>

          {activeTab === "builder" && (
            <>
              {/* Header Section */}
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-amber-700 dark:text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Application Engineer
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Upload your resume and the job description to generate a tailored, ATS-optimized application kit.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column: Input */}
                <div className="space-y-6">
                  {/* ... existing input code remains ... */}
                  {/* Since we can't easily preserve inner content with replace_file_content if it's too large, 
                      I will trust the user to manually verify if I truncated too much. 
                      Actually, for safety, I will target a smaller block if possible.
                      Wait, the Task is to REPLACE the content. I should provide the full new structure or use targeted edits.
                      Targeted edits are safer. I will cancel this chunk and use targeted edits on the tabs area.
                   */}
                </div>
              </div>
            </>
          )}

          {activeTab === "account" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account Overview</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-sm text-slate-500 mb-1">Current Plan</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {isPremium ? "Premium Plan" : "Free Trial"}
                      {isPremium && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">Active</span>}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-sm text-slate-500 mb-1">Generations Remaining</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {creditsRemaining === -1 ? "Unlimited" : creditsRemaining}
                      <FileText className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-500">Full Name</label>
                      <div className="mt-1 text-slate-900 dark:text-white">{contactInfo.fullName || "Not provided"}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500">Email</label>
                      <div className="mt-1 text-slate-900 dark:text-white">{contactInfo.email || "Not provided"}</div>
                    </div>
                  </div>
                </div>

                {/* Upgrade CTA for non-premium users */}
                {!isPremium && (
                  <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Upgrade to Premium</h3>
                        <p className="text-amber-100 text-sm">Get more generations, premium templates, and priority support.</p>
                      </div>
                      <Button
                        onClick={() => router.push("/payment")}
                        className="bg-white text-amber-600 hover:bg-amber-50 font-semibold"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        View Plans
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Payment History</h2>
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
                  </div>
                ) : payments.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                          <th className="px-4 py-3 font-medium text-slate-500">Amount</th>
                          <th className="px-4 py-3 font-medium text-slate-500">Plan</th>
                          <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="px-4 py-3 text-slate-900 dark:text-white">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-white">
                              ₹{payment.amount}
                            </td>
                            <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">
                              {payment.plan_type}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No payment history available yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generation History</h2>
                </div>

                {isLoadingHistory ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-amber-600" />
                  </div>
                ) : generations.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {generations.map((gen) => (
                      <div key={gen.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-1">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {gen.job_title || "Untitled Resume"}
                            </h3>
                            <p className="text-sm text-slate-500">{gen.company_name || "No Company Specified"}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span>{new Date(gen.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{gen.job_location || "Remote/Unknown"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGeneratedResume(gen.resume_content);
                              const url = new URL(window.location.href);
                              url.searchParams.set("tab", "builder");
                              router.push(url.pathname + url.search);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            Load to Editor
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No resumes generated yet.</p>
                    <Button onClick={() => router.push("/dashboard?tab=builder")} variant="ghost" className="mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      Create your first resume
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === "builder" && (
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">

            {/* LEFT COLUMN: Inputs */}
            <div className="space-y-6">

              {/* 1. Resume Upload */}
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-amber-600 dark:text-indigo-400">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <h2 className="font-semibold text-lg">Upload Resume</h2>
                  </div>
                  <UploadArea
                    onFileSelect={setResumeFile}
                    selectedFile={resumeFile}
                    onRemove={() => setResumeFile(null)}
                  />
                </div>
              </div>

              {/* 2. Contact Info (Collapsible) */}
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Contact Information</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Optional: Override parsed contact info</p>
                    </div>
                  </div>
                  {showContactInfo ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {showContactInfo && (
                  <div className="px-6 pb-6 space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.fullName}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email Address"
                        type="email"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone Number"
                        type="tel"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.linkedin}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="LinkedIn URL (e.g. linkedin.com/in/yourname)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.location}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Location (e.g. San Francisco, CA)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Job Description & Details */}
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <h2 className="font-semibold text-lg">Target Role Details</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={jobDetails.companyName}
                          onChange={(e) => setJobDetails(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Company Name"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={jobDetails.jobTitle}
                          onChange={(e) => setJobDetails(prev => ({ ...prev, jobTitle: e.target.value }))}
                          placeholder="Job Title"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={jobDetails.location}
                        onChange={(e) => setJobDetails(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Job Location (e.g. Remote, New York, NY)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the complete job description here..."
                      className="w-full min-h-[180px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !resumeFile || !jobDescription.trim()}
                size="lg"
                className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Optimizing Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Application Kit
                  </>
                )}
              </Button>
            </div>

            {/* RIGHT COLUMN: Results */}
            <div className="space-y-6">
              {generatedResume ? (
                <div className="space-y-6">
                  {/* Resume Card */}
                  {generatedResume && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-indigo-400 font-semibold">
                          <FileText className="w-5 h-5" />
                          Optimized Resume
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingResume(!editingResume)}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                          >
                            {editingResume ? "View Preview" : "Edit Mode"}
                          </Button>
                          <Button
                            onClick={() => handleDownload("resume")}
                            size="sm"
                            className="h-8 text-xs bg-amber-600 hover:bg-amber-700"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </div>
                      </div>

                      <div className="p-0">
                        {editingResume ? (
                          <ResumeEditor
                            content={generatedResume}
                            onSave={(edited) => {
                              setGeneratedResume(edited);
                              setEditingResume(false);
                              // Regenerate preview on save
                              generatePreviewPdf(edited, resumeMeta);
                            }}
                            onCancel={() => setEditingResume(false)}
                          />
                        ) : (
                          <div className="h-[800px] w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
                            {isPreviewLoading ? (
                              <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                                <p className="text-sm text-slate-500">Generating PDF Preview...</p>
                              </div>
                            ) : pdfPreviewUrl ? (
                              <iframe
                                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 bg-white"
                                title="Resume Preview"
                              />
                            ) : (
                              <div className="text-center text-slate-400">
                                <p>Preview not available</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  )}


                </div>
              ) : (
                // Empty State / Placeholder
                <div className="h-full min-h-[400px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                    <Sparkles className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Ready to Engineer</h3>
                  <p className="text-slate-500 max-w-sm">
                    Your generated documents will appear here with a live preview and editing capabilities.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        onUpgrade={() => router.push("/payment")}
      />
    </div>
  );
}
