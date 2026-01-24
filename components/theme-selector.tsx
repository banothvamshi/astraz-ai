"use client";

import { Check, Palette, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES } from "@/lib/themes";

interface ThemeSelectorProps {
    currentTheme: string;
    onSelect: (themeId: string) => void;
    disabled?: boolean;
    isPremiumUser?: boolean;
}

export function ThemeSelector({ currentTheme, onSelect, disabled, isPremiumUser = false }: ThemeSelectorProps) {

    const handleSelect = (theme: any) => {
        if (disabled) return;
        // Allow selection for preview, but restriction will happen on download
        onSelect(theme.id);
    };

    return (
        <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 transition-all hover:shadow-2xl">
            <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                        <Palette className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-900 dark:text-white">Design Theme</h2>
                        <p className="text-sm text-slate-500">Select a professional layout style</p>
                    </div>
                    {!isPremiumUser && (
                        <div className="ml-auto px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                            Upgrade for Premium Themes
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(THEMES).map((theme) => {
                        const isSelected = currentTheme === theme.id;
                        // NEW LOGIC: Allow selection, but show visual indicator it's premium
                        const isLocked = false;

                        return (
                            <div
                                key={theme.id}
                                onClick={() => !isLocked && handleSelect(theme)}
                                className={cn(
                                    "relative rounded-xl border p-4 transition-all",
                                    isSelected
                                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 ring-1 ring-amber-500"
                                        : "border-slate-200 dark:border-slate-800",
                                    !isLocked && !isSelected && "hover:border-amber-300 dark:hover:border-amber-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer hover:scale-[1.02]",
                                    disabled && "opacity-50 cursor-not-allowed",
                                    isLocked && "opacity-75 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className={cn(
                                        "font-semibold text-sm",
                                        isSelected ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
                                    )}>
                                        {theme.name}
                                    </span>
                                    {isSelected && (
                                        <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                            <Lock className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                    {theme.description}
                                </p>

                                {/* Color Swatches Preview */}
                                <div className="flex items-center gap-1.5 mt-3">
                                    <div
                                        className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-700"
                                        style={{ backgroundColor: `rgb(${theme.colors.primary.join(",")})` }}
                                        title="Primary"
                                    />
                                    <div
                                        className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-700"
                                        style={{ backgroundColor: `rgb(${theme.colors.accent.join(",")})` }}
                                        title="Accent"
                                    />
                                </div>

                                {isLocked && (
                                    <div className="absolute inset-0 z-10" title="Upgrade to unlock this theme" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
