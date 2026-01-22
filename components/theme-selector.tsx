"use client";

import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES } from "@/lib/themes";

interface ThemeSelectorProps {
    currentTheme: string;
    onSelect: (themeId: string) => void;
    disabled?: boolean;
}

export function ThemeSelector({ currentTheme, onSelect, disabled }: ThemeSelectorProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-all hover:shadow-xl">
            <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                        <Palette className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-slate-900 dark:text-white">Design Theme</h2>
                        <p className="text-sm text-slate-500">Select a professional layout style</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(THEMES).map((theme) => {
                        const isSelected = currentTheme === theme.id;
                        return (
                            <div
                                key={theme.id}
                                onClick={() => !disabled && onSelect(theme.id)}
                                className={cn(
                                    "relative cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02]",
                                    isSelected
                                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 ring-1 ring-amber-500"
                                        : "border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                    disabled && "opacity-50 cursor-not-allowed"
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
