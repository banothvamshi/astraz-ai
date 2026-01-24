"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
}

export function UploadArea({ onFileSelect, selectedFile, onRemove }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      {selectedFile ? (
        <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
              {selectedFile.name}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              ✓ Ready to process • {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 transition-all hover:border-amber-400 hover:bg-amber-50/30 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/10",
            isDragging && "border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-[1.01] ring-4 ring-amber-500/10"
          )}
        >
          <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-5 dark:from-amber-900/40 dark:to-orange-900/40 shadow-lg shadow-amber-500/10">
            <Upload className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Click to upload or drag and drop
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              PDF files only (max 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
