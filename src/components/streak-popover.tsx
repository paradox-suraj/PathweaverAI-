"use client";

import { useState, useEffect, useRef } from "react";
import { format, getDaysInMonth, startOfMonth, isBefore, isToday, isSameDay } from "date-fns";

interface StreakTask {
  id: string;
  taskType: string;
  isCompleted: boolean;
  rewardCredits: number;
}

interface StreakPopoverProps {
  initialStreak: number;
}

export function StreakPopover({ initialStreak }: StreakPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [streak, setStreak] = useState(initialStreak);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [tasks, setTasks] = useState<StreakTask[]>([]);
  const [loading, setLoading] = useState(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const res = await fetch(`/api/streak?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
      if (res.ok) {
        const data = await res.json();
        setActiveDates(data.activeDates || []);
        setTasks(data.dailyTasks || []);
        if (data.streak !== undefined) setStreak(data.streak);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePopover = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchData();
    }
  };

  const claimTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/streak/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, isCompleted: true } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const now = new Date();
  const daysInMonth = getDaysInMonth(now);
  const firstDay = startOfMonth(now);
  
  const calendarDays = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    calendarDays.push(null); // empty padding
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(now.getFullYear(), now.getMonth(), i));
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={togglePopover}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-2 border border-accent-amber/20 hover:border-accent-amber transition-colors"
      >
        <span
          className="material-symbols-outlined text-accent-amber text-lg"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_fire_department
        </span>
        <span className="font-label-mono text-label-mono text-accent-amber font-bold">
          {streak} {streak === 1 ? 'Day' : 'Days'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 surface-glass border border-white/10 shadow-2xl rounded-xl z-50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 bg-surface-1">
            <h3 className="font-headline-sm font-bold text-on-surface">Streak Activity</h3>
            <p className="text-sm text-on-surface-variant">Maintain your streak to earn a monthly badge and credits!</p>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-on-surface-variant py-1">{d}</div>
                  ))}
                  {calendarDays.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="p-2" />;
                    
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isActive = activeDates.includes(dateStr);
                    const isPast = isBefore(date, now) && !isToday(date);
                    const isTodayDate = isToday(date);

                    let bgColor = "bg-surface-variant/30";
                    let textColor = "text-on-surface-variant";
                    
                    if (isActive) {
                      bgColor = "bg-accent-emerald/20 border border-accent-emerald/50";
                      textColor = "text-accent-emerald font-bold";
                    } else if (isPast) {
                      bgColor = "bg-accent-rose/20 border border-accent-rose/30";
                      textColor = "text-accent-rose";
                    }

                    return (
                      <div 
                        key={dateStr}
                        className={`flex items-center justify-center rounded-md p-1.5 text-sm ${bgColor} ${textColor} ${isTodayDate ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-1' : ''}`}
                        title={dateStr}
                      >
                        {format(date, "d")}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Daily Tasks for Credits</h4>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">No tasks for today.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-surface-2 p-2 rounded-lg border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface">{task.taskType.replace("_", " ")}</span>
                            <span className="text-[10px] text-accent-amber">+{task.rewardCredits} Credits</span>
                          </div>
                          {task.isCompleted ? (
                            <span className="text-xs text-accent-emerald flex items-center"><span className="material-symbols-outlined text-sm mr-1">check_circle</span>Claimed</span>
                          ) : (
                            <button 
                              onClick={() => claimTask(task.id)}
                              className="px-2 py-1 bg-primary/20 hover:bg-primary/40 text-primary text-xs rounded transition-colors font-bold"
                            >
                              Claim
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
