"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Loader2,
    Bell,
    Shield,
    CreditCard,
    Globe,
    Database,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { getSystemSettings, updateSystemSettings, SystemSettings } from "@/app/actions/settings";

interface SettingItem {
    label: string;
    description: string;
    type: "toggle" | "number" | "select";
    key: keyof SystemSettings;
    value: boolean | number | string;
    dangerous?: boolean;
    options?: { value: string; label: string }[];
}

interface SettingCard {
    title: string;
    icon: any;
    color: string;
    settings: SettingItem[];
}

export default function SettingsPage() {
    // Initial state with defaults until fetched
    const [settings, setSettings] = useState<SystemSettings>({
        id: 1,
        free_trial_credits: 1,
        maintenance_mode: false,
        registration_enabled: true,
        email_notifications: true,
        max_daily_generations: 50,
        default_plan: "free",
        enable_guest_access: true,
        enable_ip_check: true,
        guest_generation_limit: 1
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await getSystemSettings();
            if (data) setSettings(data);
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key: keyof SystemSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        setHasChanges(true);
    };

    const handleChange = (key: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateSystemSettings(settings);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Settings saved successfully!");
                setHasChanges(false);
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const settingCards: SettingCard[] = [
        {
            title: "Registration & Onboarding",
            icon: Shield,
            color: "indigo",
            settings: [
                {
                    label: "User Registration",
                    description: "Allow new users to create accounts",
                    type: "toggle",
                    key: "registration_enabled" as keyof SystemSettings,
                    value: settings.registration_enabled
                },
                {
                    label: "Free Trial Credits",
                    description: "Number of free generations for new users",
                    type: "number",
                    key: "free_trial_credits" as keyof SystemSettings,
                    value: settings.free_trial_credits
                }
            ]
        },
        {
            title: "System Controls",
            icon: Database,
            color: "amber",
            settings: [
                {
                    label: "Maintenance Mode",
                    description: "Temporarily disable access for non-admins",
                    type: "toggle",
                    key: "maintenance_mode" as keyof SystemSettings,
                    value: settings.maintenance_mode,
                    dangerous: true
                },
                {
                    label: "Max Daily Generations",
                    description: "Rate limit per user per day",
                    type: "number",
                    key: "max_daily_generations" as keyof SystemSettings,
                    value: settings.max_daily_generations
                }
            ]
        },
        {
            title: "Rate Limiting & Guest Access",
            icon: Shield, // Reusing Shield or maybe Globe
            color: "purple",
            settings: [
                {
                    label: "Enable Guest Access",
                    description: "Allow non-logged-in users to generate resumes",
                    type: "toggle",
                    key: "enable_guest_access" as keyof SystemSettings,
                    value: settings.enable_guest_access
                },
                {
                    label: "Guest Generation Limit",
                    description: "Max generations allowed for guests (per IP)",
                    type: "number",
                    key: "guest_generation_limit" as keyof SystemSettings,
                    value: settings.guest_generation_limit
                },
                {
                    label: "Unique IP Check",
                    description: "Strictly enforce 1 trial per unique IP address",
                    type: "toggle",
                    key: "enable_ip_check" as keyof SystemSettings,
                    value: settings.enable_ip_check
                }
            ]
        },
        {
            title: "Notifications",
            icon: Bell,
            color: "emerald",
            settings: [
                {
                    label: "Email Notifications",
                    description: "Send transactional emails to users",
                    type: "toggle",
                    key: "email_notifications" as keyof SystemSettings,
                    value: settings.email_notifications
                }
            ]
        },
        {
            title: "Billing Defaults",
            icon: CreditCard,
            color: "purple",
            settings: [
                {
                    label: "Default Plan",
                    description: "Plan assigned to new registrations",
                    type: "select",
                    key: "default_plan" as keyof SystemSettings,
                    value: settings.default_plan,
                    options: [
                        { value: "free", label: "Free" },
                        { value: "starter", label: "Starter" },
                        { value: "professional", label: "Professional" }
                    ]
                }
            ]
        }
    ];

    const colorMap: Record<string, string> = {
        indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Configuration</h1>
                    <p className="text-slate-500 mt-1">Manage global platform settings and controls</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {hasChanges ? "Save Changes" : "Saved"}
                </Button>
            </div>

            {/* Maintenance Mode Warning */}
            {settings.maintenance_mode && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-4">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                    <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-200">Maintenance Mode Active</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">Only admins can access the platform right now.</p>
                    </div>
                </div>
            )}

            {/* Settings Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {settingCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${colorMap[card.color]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">{card.title}</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                {card.settings.map((setting) => (
                                    <div key={setting.key} className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white">{setting.label}</p>
                                            <p className="text-sm text-slate-500 truncate">{setting.description}</p>
                                        </div>
                                        <div className="shrink-0">
                                            {setting.type === "toggle" && (
                                                <button
                                                    onClick={() => handleToggle(setting.key)}
                                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${setting.value
                                                        ? (setting.dangerous ? 'bg-amber-500' : 'bg-emerald-500')
                                                        : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                >
                                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${setting.value ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            )}
                                            {setting.type === "number" && (
                                                <input
                                                    type="number"
                                                    value={setting.value as number}
                                                    onChange={(e) => handleChange(setting.key, parseInt(e.target.value) || 0)}
                                                    className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center font-medium"
                                                />
                                            )}
                                            {setting.type === "select" && (
                                                <select
                                                    value={setting.value as string}
                                                    onChange={(e) => handleChange(setting.key, e.target.value)}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                                                >
                                                    {setting.options?.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Environment Info */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-slate-500" />
                    Environment Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-sm text-slate-500">Platform</p>
                        <p className="font-medium text-slate-900 dark:text-white">Astraz AI</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Version</p>
                        <p className="font-medium text-slate-900 dark:text-white">2.0.0</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Environment</p>
                        <p className="font-medium text-emerald-600">Production</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Last Deploy</p>
                        <p className="font-medium text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
