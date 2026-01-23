"use client";

import { useState, useEffect } from "react";
import { Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeEditorProps {
  content: string;
  contactInfo?: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    location: string;
  };
  onSave: (editedContent: string) => void;
  onCancel: () => void;
}

export function ResumeEditor({ content, contactInfo, onSave, onCancel }: ResumeEditorProps) { // Sync v2
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Debounce preview updates
  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview();
    }, 1500); // 1.5s debounce
    return () => clearTimeout(timer);
  }, [editedContent]);

  const updatePreview = async () => {
    // Only update if we are in a wide view or specifically looking at preview
    setIsPreviewLoading(true);
    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editedContent,
          type: "resume", // Default to resume, could be prop
          preview: true,
          // Pass contact info for header rendering
          name: contactInfo?.fullName,
          email: contactInfo?.email,
          phone: contactInfo?.phone,
          linkedin: contactInfo?.linkedin,
          location: contactInfo?.location
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev); // Cleanup old
          return url;
        });
      }
    } catch (e) {
      console.error("Preview generation failed", e);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(editedContent);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Edit & Preview
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Edit markdown on the left, see PDF on the right.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'write' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500'}`}
            >
              Write
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'preview' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500'}`}
            >
              Preview
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[700px] grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor Pane */}
        <div className={`flex flex-col h-full ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-t-lg border border-slate-200 dark:border-slate-700 border-b-0 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Markdown Source</span>
          </div>
          <div className="flex-1 rounded-b-lg border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 relative">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none dark:text-slate-50 dark:placeholder:text-slate-500"
              placeholder="# Your Resume Content..."
            />
          </div>
        </div>

        {/* Preview Pane */}
        <div className={`flex flex-col h-full ${activeTab === 'write' ? 'hidden md:flex' : 'flex'}`}>
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-t-lg border border-slate-200 dark:border-slate-700 border-b-0 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Live PDF Preview</span>
            {isPreviewLoading && <span className="text-xs text-blue-500 animate-pulse">Updating...</span>}
          </div>
          <div className="flex-1 rounded-b-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900 overflow-hidden relative">
            {previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <p>Loading Preview...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <strong>Pro Tip:</strong> Use the playground to experiment. The PDF on the right updates automatically as you type.
        </p>
      </div>
    </div>
  );
}
