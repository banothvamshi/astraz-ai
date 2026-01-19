"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Download, Sparkles, ArrowLeft, Edit2, UploadCloud, Briefcase, ChevronDown, ChevronUp, User, Mail, Phone, Linkedin, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadArea } from "@/components/upload-area";
import { PaywallModal } from "@/components/paywall-modal";
import { ResumeEditor } from "@/components/resume-editor";
import { canUseFreeTrial, markTrialUsed, hasUsedTrial } from "@/lib/storage";

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
  const [editingCoverLetter, setEditingCoverLetter] = useState(false);

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

  useEffect(() => {
    setCanTrial(canUseFreeTrial());
    setIsPremium(localStorage.getItem("astraz_premium") === "true");

    // Check URL params for premium status
    const params = new URLSearchParams(window.location.search);
    if (params.get("premium") === "true") {
      setIsPremium(true);
      localStorage.setItem("astraz_premium", "true");
    }
  }, []);

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

  const handleDownload = async (type: "resume" | "coverLetter") => {
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
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `${type === "resume" ? "Resume" : "CoverLetter"}_${timestamp}.pdf`;
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
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-indigo-100/50 bg-white/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Astraz AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard/debug-parser")}
              variant="ghost"
              className="hidden sm:flex text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Debug Tools
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="mx-auto max-w-5xl">

          {/* Header Section */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Application Engineer
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Upload your resume and the job description to generate a tailored, ATS-optimized application kit.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">

            {/* LEFT COLUMN: Inputs */}
            <div className="lg:col-span-5 space-y-6">

              {/* 1. Resume Upload */}
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
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
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email Address"
                        type="email"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone Number"
                        type="tel"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.linkedin}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="LinkedIn URL (e.g. linkedin.com/in/yourname)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={contactInfo.location}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Location (e.g. San Francisco, CA)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Job Description & Details */}
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
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
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={jobDetails.jobTitle}
                          onChange={(e) => setJobDetails(prev => ({ ...prev, jobTitle: e.target.value }))}
                          placeholder="Job Title"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={jobDetails.location}
                        onChange={(e) => setJobDetails(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Job Location (e.g. Remote, New York, NY)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all"
                      />
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the complete job description here..."
                      className="w-full min-h-[180px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !resumeFile || !jobDescription.trim()}
                size="lg"
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
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
            <div className="lg:col-span-7">
              {(generatedResume || generatedCoverLetter) ? (
                <div className="space-y-6">
                  {/* Resume Card */}
                  {generatedResume && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
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
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
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
                            }}
                            onCancel={() => setEditingResume(false)}
                          />
                        ) : (
                          <div className="h-[600px] overflow-y-auto p-8 bg-white dark:bg-slate-950 scrollbar-thin">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                                {generatedResume}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cover Letter Card */}
                  {generatedCoverLetter && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                          <FileText className="w-5 h-5" />
                          Cover Letter
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingCoverLetter(!editingCoverLetter)}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                          >
                            {editingCoverLetter ? "View Preview" : "Edit Mode"}
                          </Button>
                          <Button
                            onClick={() => handleDownload("coverLetter")}
                            size="sm"
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </div>
                      </div>
                      <div className="p-0">
                        {editingCoverLetter ? (
                          <ResumeEditor
                            content={generatedCoverLetter}
                            onSave={(edited) => {
                              setGeneratedCoverLetter(edited);
                              setEditingCoverLetter(false);
                            }}
                            onCancel={() => setEditingCoverLetter(false)}
                          />
                        ) : (
                          <div className="h-[400px] overflow-y-auto p-8 bg-white dark:bg-slate-950 scrollbar-thin">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 font-serif">
                                {generatedCoverLetter}
                              </div>
                            </div>
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
      </div>

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        onUpgrade={() => router.push("/payment")}
      />
    </div>
  );
}
