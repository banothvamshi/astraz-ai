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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Edit Resume
        </h3>
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
      
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full min-h-[500px] rounded-lg border-0 bg-transparent p-4 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-50 dark:placeholder:text-slate-500"
          placeholder="Edit your resume content here..."
        />
      </div>
      
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> You can add, remove, or modify any section. The content will be formatted automatically when you download the PDF.
        </p>
      </div>
    </div>
  );
}
