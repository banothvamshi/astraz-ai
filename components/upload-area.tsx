"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
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
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <FileText className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20",
            isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          )}
        >
          <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
            <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
