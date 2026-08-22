"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2, RefreshCw } from "lucide-react";
import { replanScheduleAction } from "@/server/actions/schedule";

type ReplanScheduleModalProps = {
  courseId: string;
};

export function ReplanScheduleModal({ courseId }: ReplanScheduleModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleReplan = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await replanScheduleAction(courseId, hoursPerDay, deadlineDate || undefined);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error || "Failed to replan schedule");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-slate-300 bg-white shadow-sm hover:bg-slate-100 h-9 px-4 py-2 text-slate-600">
        <RefreshCw className="w-4 h-4 mr-2" />
        Replan Schedule
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaptive Replanning</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleReplan} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="hoursPerDay">Study Hours per Day</Label>
            <Input
              id="hoursPerDay"
              type="number"
              min={1}
              max={12}
              value={hoursPerDay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoursPerDay(Number(e.target.value))}
              required
            />
            <p className="text-xs text-slate-500">
              We'll redistribute your remaining topics based on this pace.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadlineDate">New Target Completion Date (Optional)</Label>
            <div className="relative">
              <Input
                id="deadlineDate"
                type="date"
                value={deadlineDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadlineDate(e.target.value)}
                className="pl-10"
              />
              <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
          </div>
          
          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Replan Now
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
