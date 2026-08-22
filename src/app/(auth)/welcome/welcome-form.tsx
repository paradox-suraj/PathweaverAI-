"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setPrimaryGoal } from '@/server/actions/onboarding';

export function WelcomeForm() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const goals = [
    { title: "Master a New Skill", icon: "school", color: "text-primary" },
    { title: "Career Pivot", icon: "trending_up", color: "text-secondary" },
    { title: "Academic Support", icon: "menu_book", color: "text-info" },
    { title: "Personal Interest", icon: "explore", color: "text-accent-amber" }
  ];

  const handleStart = async () => {
    if (!selectedGoal) return;
    
    setIsLoading(true);
    try {
      await setPrimaryGoal(selectedGoal);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sp-4 mb-sp-8">
        {goals.map((goal) => (
          <button
            key={goal.title}
            onClick={() => setSelectedGoal(goal.title)}
            className={`goal-card flex flex-col items-center justify-center p-sp-6 bg-surface-1 border rounded-xl hover:border-primary/50 transition-all duration-300 group ${
              selectedGoal === goal.title
                ? "border-primary/50 bg-primary/10 shadow-glow-primary"
                : "border-outline-variant/30"
            }`}
          >
            <span className={`material-symbols-outlined text-4xl mb-sp-3 transition-transform ${goal.color} ${selectedGoal === goal.title ? 'scale-110' : 'group-hover:scale-110'}`}>
              {goal.icon}
            </span>
            <span className="font-headline-md text-text-primary text-center">{goal.title}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-sp-8">
        <button
          onClick={handleStart}
          disabled={!selectedGoal || isLoading}
          className="w-full sm:w-auto px-sp-8 py-sp-4 bg-primary-gradient text-text-primary font-headline-md rounded-lg hover:scale-[1.02] active:scale-[0.97] hover:shadow-glow-primary transition-all duration-300 flex items-center justify-center gap-sp-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {isLoading ? "Setting up..." : "Get Started"}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </>
  );
}
