"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function CalendarExportDialog({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const getFeedUrl = () => {
    return `${window.location.origin}/api/calendar/feed/${userId}`;
  };

  const subscribeGoogle = () => {
    window.open(`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(getFeedUrl())}`, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-secondary hover:text-secondary-container font-label-mono text-label-mono transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">calendar_month</span> Add to Calendar
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-surface-1 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Sync your Study Plan</DialogTitle>
            <DialogDescription className="text-text-muted">
              Choose how you want to add your upcoming study sessions to your calendar. This will keep your calendar automatically updated as you learn.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <button
              onClick={subscribeGoogle}
              className="flex items-center gap-3 p-4 rounded-lg border border-white/10 hover:border-primary/50 hover:bg-surface-2 transition-all text-left"
            >
              <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-6 h-6" alt="Google Calendar" width={24} height={24} loading="lazy" />
              <div>
                <h4 className="text-text-primary font-medium text-sm">Google Calendar</h4>
                <p className="text-text-muted text-xs">Directly subscribe in your browser</p>
              </div>
            </button>

            <a
              href={`webcal://${typeof window !== 'undefined' ? window.location.host : ''}/api/calendar/feed/${userId}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 rounded-lg border border-white/10 hover:border-primary/50 hover:bg-surface-2 transition-all text-left"
            >
              <div className="w-6 h-6 flex items-center justify-center bg-blue-500/10 rounded-md text-blue-500">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </div>
              <div>
                <h4 className="text-text-primary font-medium text-sm">Apple Calendar</h4>
                <p className="text-text-muted text-xs">Open in your default calendar app</p>
              </div>
            </a>

            <a
              href={`/api/calendar/download`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 rounded-lg border border-white/10 hover:border-primary/50 hover:bg-surface-2 transition-all text-left"
            >
              <div className="w-6 h-6 flex items-center justify-center bg-surface-3 rounded-md text-text-primary">
                <span className="material-symbols-outlined text-[20px]">download</span>
              </div>
              <div>
                <h4 className="text-text-primary font-medium text-sm">Download .ics File</h4>
                <p className="text-text-muted text-xs">Manually import to any calendar</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
