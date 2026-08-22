"use client";

import { useState, useEffect } from "react";
import quotesData from "../../quotes.json";

interface DashboardGreetingProps {
  userName: string;
  courseTitle?: string | null;
}

export function DashboardGreeting({ userName, courseTitle }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Good Morning");
  const [quote, setQuote] = useState(quotesData[0]);

  useEffect(() => {
    // Determine greeting based on local time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    // Determine quote of the day based on local date
    const date = new Date();
    // A simple hash of the date to get a consistent quote for the whole day
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % quotesData.length;
    setQuote(quotesData[quoteIndex]);
  }, []);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div>
        <h2 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-text-primary mb-2 capitalize">
          {greeting}, {userName}
        </h2>
        
        <p className="font-body-lg text-body-lg text-text-muted">
          {courseTitle
            ? `You're making great progress. Ready to dive back into ${courseTitle}?`
            : "Welcome to PathWeaver AI! Ready to start a new learning journey?"}
        </p>
      </div>

      <div className="bg-surface-2/50 border border-white/5 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
        <p className="font-body-base text-text-secondary italic">"{quote.text}"</p>
        <p className="font-label-mono text-[11px] text-text-muted uppercase tracking-wider mt-2">— {quote.author}</p>
      </div>
    </div>
  );
}
