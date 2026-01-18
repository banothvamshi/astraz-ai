"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Download, Sparkles, ArrowLeft, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadArea } from "@/components/upload-area";
import { PaywallModal } from "@/components/paywall-modal";
import { ResumeEditor } from "@/components/resume-editor";
import { canUseFreeTrial, markTrialUsed, hasUsedTrial } from "@/lib/storage";

export default function Dashboard() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [canTrial, setCanTrial] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [editingCoverLetter, setEditingCoverLetter] = useState(false);

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
          companyName: companyName.trim() || undefined,
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
      // Extract name and email from resume if available
      const nameMatch = content.match(/^#\s*(.+)$/m);
      const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          type,
          name: nameMatch ? nameMatch[1].trim() : undefined,
          email: emailMatch ? emailMatch[1] : undefined,
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

  const handleUpgrade = () => {
    // Redirect to payment page
    router.push("/payment");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-slate-900">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Astraz AI
            </span>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-50 sm:text-4xl">
              Generate Your Application Kit
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Upload your resume and paste the job description to get ATS-optimized results
            </p>
          </div>

          <div className="space-y-6">
            {/* Resume Upload */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                1. Upload Your Resume (PDF)
              </h2>
              <UploadArea
                onFileSelect={setResumeFile}
                selectedFile={resumeFile}
                onRemove={() => setResumeFile(null)}
              />
            </div>

            {/* Job Description */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                2. Paste Job Description
              </h2>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name (optional, helps targeting)"
                className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="w-full min-h-[200px] rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !resumeFile || !jobDescription.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-800"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Resume & Cover Letter
                </>
              )}
            </Button>

            {/* Results */}
            {(generatedResume || generatedCoverLetter) && (
              <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Your Generated Documents
                </h2>
                
                {/* Resume Section */}
                {generatedResume && (
                  <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                              Generated Resume
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setEditingResume(true)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDownload("resume")}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-900">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                {generatedResume.split('\n').map((line, idx) => {
                                  if (line.startsWith('#')) {
                                    return (
                                      <h3 key={idx} className="mt-6 mb-3 text-lg font-bold text-slate-900 dark:text-slate-50 first:mt-0">
                                        {line.replace(/^#+\s*/, '')}
                                      </h3>
                                    );
                                  }
                                  if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line.trim())) {
                                    return (
                                      <div key={idx} className="ml-6 mb-2 text-slate-700 dark:text-slate-300">
                                        {line.replace(/^[-*•]\s*/, '• ').replace(/^\d+\.\s*/, '• ')}
                                      </div>
                                    );
                                  }
                                  if (line.trim() === '') {
                                    return <br key={idx} />;
                                  }
                                  if (line.includes('**')) {
                                    const boldText = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return (
                                      <p key={idx} className="mb-2 font-semibold text-slate-900 dark:text-slate-50" dangerouslySetInnerHTML={{ __html: boldText }} />
                                    );
                                  }
                                  return (
                                    <p key={idx} className="mb-2 text-slate-700 dark:text-slate-300">
                                      {line}
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ✓ Your resume has been generated! Review it above. Click "Edit" to make final adjustments, or "Download PDF" to get your professional resume.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Cover Letter Section */}
                {generatedCoverLetter && (
                  <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                              Generated Cover Letter
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setEditingCoverLetter(true)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDownload("coverLetter")}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-900">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                {generatedCoverLetter.split('\n').map((line, idx) => {
                                  if (line.startsWith('#')) {
                                    return (
                                      <h3 key={idx} className="mt-6 mb-3 text-lg font-bold text-slate-900 dark:text-slate-50 first:mt-0">
                                        {line.replace(/^#+\s*/, '')}
                                      </h3>
                                    );
                                  }
                                  if (line.trim() === '') {
                                    return <br key={idx} />;
                                  }
                                  if (line.includes('**')) {
                                    const boldText = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                    return (
                                      <p key={idx} className="mb-3 font-semibold text-slate-900 dark:text-slate-50" dangerouslySetInnerHTML={{ __html: boldText }} />
                                    );
                                  }
                                  return (
                                    <p key={idx} className="mb-3 text-slate-700 dark:text-slate-300">
                                      {line}
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ✓ Your cover letter has been generated! Review it above. Click "Edit" to make final adjustments, or "Download PDF" to get your professional cover letter.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
