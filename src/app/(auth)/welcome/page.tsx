import React from 'react';
import { WelcomeForm } from './welcome-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const existingGoal = await prisma.learningGoal.findFirst({
    where: { userId: session.user.id }
  });

  if (existingGoal) {
    redirect('/dashboard');
  }

  return (
    <div className="bg-bg-base text-on-surface font-body-base min-h-screen flex items-center justify-center p-gutter md:p-margin-desktop relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-info/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <main className="w-full max-w-[600px] z-10">
        {/* Header Section */}
        <header className="text-center mb-sp-8 flex flex-col items-center">
          <div className="font-display-xl-mobile md:font-display-xl text-primary-gradient mb-sp-4 tracking-tight">PathWeaver AI</div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-text-primary mb-sp-2">Welcome to PathWeaver AI</h1>
          <p className="font-body-lg text-text-secondary">Select your primary goal to personalize your AI learning journey.</p>
        </header>

        <WelcomeForm />
      </main>
    </div>
  );
}
