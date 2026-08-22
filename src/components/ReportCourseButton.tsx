"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  "Adult or sexually explicit content",
  "Hate speech or harassment",
  "Misleading or inaccurate information",
  "Intellectual property violation",
  "Spam or excessive self-promotion",
];

export function ReportCourseButton({ courseId, isOwner }: { courseId: string; isOwner: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isReported, setIsReported] = useState(false);

  const handleReport = async () => {
    if (!selectedReason) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: selectedReason }),
      });
      if (res.ok) {
        setIsReported(true);
        setIsOpen(false);
      } else {
        const errData = await res.json().catch(() => null);
        console.error("Failed to report course", errData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isOwner) return null;

  if (isReported) {
    return (
      <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" disabled>
        <Flag className="w-4 h-4 mr-2" />
        Reported
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-transparent text-text-muted hover:bg-red-500/10 hover:text-red-500">
        <Flag className="w-4 h-4 mr-2" />
        Report
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-surface-1 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-headline-md text-red-500">
            <AlertTriangle className="w-6 h-6" />
            Report Course
          </DialogTitle>
          <DialogDescription className="text-text-secondary mt-2">
            If this course violates our community guidelines, please let us know. We use automated AI systems to quickly moderate and remove violating content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          <p className="text-sm font-medium text-text-primary mb-2">Select a reason:</p>
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                selectedReason === reason
                  ? "bg-red-500/10 border-red-500/50 text-red-400"
                  : "bg-surface-2 border-white/5 text-text-primary hover:border-white/20"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full sm:w-auto text-text-primary">
            Cancel
          </DialogClose>
          <Button 
            onClick={handleReport} 
            disabled={isLoading || !selectedReason}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
