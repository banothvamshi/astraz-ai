"use client";

import { useState } from "react";
import { Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeEditorProps {
  content: string;
  onSave: (editedContent: string) => void;
  onCancel: () => void;
}

export function ResumeEditor({ content, onSave, onCancel }: ResumeEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSave(editedContent);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Edit Mode
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Make final adjustments to your document. Changes will be saved when you click "Save Changes".
          </p>
        </div>
        <div className="flex gap-2">
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
      
      <div className="rounded-lg border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full min-h-[600px] rounded-lg border-0 bg-transparent p-6 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-50 dark:placeholder:text-slate-500"
          placeholder="Edit your document content here..."
        />
      </div>
      
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <strong>Editing Tips:</strong> You can add, remove, or modify any section. Use markdown formatting (# for headings, - for bullets). The content will be professionally formatted when you download the PDF.
        </p>
      </div>
    </div>
  );
}
