"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    MessageSquare,
    Settings,
    ArrowLeft,
    Download,
    Clock,
    Send,
    CheckCircle,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfHistoryItem {
    id: string;
    job_title: string;
    company_name: string;
    created_at: string;
}

interface SupportTicket {
    id: string;
    subject: string;
    status: "open" | "in_progress" | "resolved";
    created_at: string;
    admin_response?: string;
}

export default function UserPortal() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"history" | "support" | "settings">("history");
    const [pdfHistory, setPdfHistory] = useState<PdfHistoryItem[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    // Support form state
    const [ticketSubject, setTicketSubject] = useState("");
    const [ticketMessage, setTicketMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check premium status
        const premium = localStorage.getItem("astraz_premium") === "true";
        setIsPremium(premium);

        // Fetch user data
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            // Mock data for demonstration
            setPdfHistory([
                { id: "1", job_title: "Senior Software Engineer", company_name: "Google", created_at: "2024-01-20T10:30:00Z" },
                { id: "2", job_title: "Product Manager", company_name: "Microsoft", created_at: "2024-01-18T14:45:00Z" },
                { id: "3", job_title: "Full Stack Developer", company_name: "Amazon", created_at: "2024-01-15T09:15:00Z" },
            ]);
            setTickets([
                { id: "1", subject: "PDF download issue", status: "resolved", created_at: "2024-01-19T11:00:00Z", admin_response: "Issue has been fixed. Please try again." },
                { id: "2", subject: "Resume formatting question", status: "open", created_at: "2024-01-21T08:30:00Z" },
            ]);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitTicket = async () => {
        if (!ticketSubject.trim() || !ticketMessage.trim()) return;

        setIsSubmitting(true);
        try {
            // Mock submission
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTickets([
                { id: Date.now().toString(), subject: ticketSubject, status: "open", created_at: new Date().toISOString() },
                ...tickets
            ]);
            setTicketSubject("");
            setTicketMessage("");
            alert("Support ticket submitted successfully!");
        } catch (error) {
            alert("Failed to submit ticket. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        };
        return styles[status] || styles.open;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            My Account
                        </h1>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${isPremium
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                        {isPremium ? "Premium" : "Free Plan"}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="mb-8 flex gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                    {[
                        { id: "history", label: "PDF History", icon: FileText },
                        { id: "support", label: "Support", icon: MessageSquare },
                        { id: "settings", label: "Settings", icon: Settings },
                    ].map(({ id, label, icon: Icon }) => (
                        <Button
                            key={id}
                            variant={activeTab === id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab(id as typeof activeTab)}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            {label}
                        </Button>
                    ))}
                </div>

                {/* History Tab */}
                {activeTab === "history" && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Generated Resumes</h2>
                        {pdfHistory.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pdfHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">{item.job_title}</h3>
                                                <p className="text-sm text-slate-500">{item.company_name}</p>
                                            </div>
                                            <FileText className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                            <Button size="sm" variant="outline" className="h-7 text-xs">
                                                <Download className="mr-1 h-3 w-3" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-4 text-slate-500">No resumes generated yet</p>
                                <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                                    Create Your First Resume
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Support Tab */}
                {activeTab === "support" && (
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Submit Ticket Form */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Submit a Ticket</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                    <input
                                        type="text"
                                        value={ticketSubject}
                                        onChange={(e) => setTicketSubject(e.target.value)}
                                        placeholder="Brief description of your issue"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                                    <textarea
                                        value={ticketMessage}
                                        onChange={(e) => setTicketMessage(e.target.value)}
                                        placeholder="Describe your issue in detail..."
                                        rows={5}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 resize-none"
                                    />
                                </div>
                                <Button
                                    onClick={handleSubmitTicket}
                                    disabled={isSubmitting || !ticketSubject.trim() || !ticketMessage.trim()}
                                    className="w-full"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                                    ) : (
                                        <><Send className="mr-2 h-4 w-4" />Submit Ticket</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Existing Tickets */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Your Tickets</h2>
                            {tickets.length > 0 ? (
                                <div className="space-y-3">
                                    {tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{ticket.subject}</p>
                                                    <p className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                                                    {ticket.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            {ticket.admin_response && (
                                                <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                    <strong>Response:</strong> {ticket.admin_response}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 py-8">No tickets submitted yet</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <div className="max-w-2xl">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Account Settings</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Subscription Status</p>
                                        <p className="text-sm text-slate-500">{isPremium ? "Premium (Lifetime)" : "Free Plan"}</p>
                                    </div>
                                    {!isPremium && (
                                        <Button size="sm" onClick={() => router.push("/payment")}>
                                            Upgrade
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Resumes Generated</p>
                                        <p className="text-sm text-slate-500">{pdfHistory.length} resumes</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
