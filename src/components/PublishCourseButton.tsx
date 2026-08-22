"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
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

export function PublishCourseButton({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
    if (published) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        setPublished(true);
        setIsOpen(false);
        router.refresh();
      } else {
        console.error("Failed to publish course");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (published) {
    return (
      <Button variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10 cursor-default" disabled>
        <Check className="w-4 h-4 mr-2" />
        Published to Community
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input shadow-sm h-9 px-4 py-2 bg-transparent hover:bg-primary hover:text-white">
        <Share2 className="w-4 h-4 mr-2" />
        Publish to Community
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md md:max-w-lg bg-surface-1 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-headline-md text-text-primary">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Community Guidelines
          </DialogTitle>
          <DialogDescription className="text-text-secondary mt-2">
            Before publishing your course to the global community, please review and agree to our content policies.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 text-sm text-text-primary">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">1. No Adult or Vulgar Content</p>
              <p className="text-text-muted mt-1">Courses containing sexually explicit material, extreme violence, or vulgar language will be removed immediately.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">2. Educational Value & Accuracy</p>
              <p className="text-text-muted mt-1">Ensure your course provides genuine educational value. Misleading titles or inaccurate information are strictly prohibited.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">3. No Hate Speech or Harassment</p>
              <p className="text-text-muted mt-1">Content that promotes discrimination, hate speech, or harassment against any individual or group is not tolerated.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">4. Respect Intellectual Property</p>
              <p className="text-text-muted mt-1">Do not distribute copyrighted material that you do not own. Plagiarism will result in an account ban.</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-2 p-3 rounded-lg border border-white/5 mb-4">
          <p className="text-xs text-text-muted text-center">
            By clicking "I Agree & Publish", you confirm that your course adheres to all community guidelines. Violations may result in account termination.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full sm:w-auto text-text-primary">
            Cancel
          </DialogClose>
          <Button 
            onClick={handlePublish} 
            disabled={isLoading}
            className="w-full sm:w-auto bg-primary-gradient text-white"
          >
            {isLoading ? "Publishing..." : "I Agree & Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
