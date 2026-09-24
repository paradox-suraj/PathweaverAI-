import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Mail, Calendar } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ApiKeyForm } from "@/components/api-key-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch the first learning event to approximate join date
  const firstEvent = await prisma.learningEvent.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' }
  });

  const joinDate = firstEvent 
    ? new Date(firstEvent.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary mb-6 transition-colors font-label-mono uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-sp-8">
        <h1 className="font-display-xl text-display-xl text-text-primary mb-2">Settings</h1>
        <p className="font-body-lg text-text-muted">Manage your account profile and preferences.</p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mb-6">
        <div className="p-6 border-b border-white/5 bg-surface-2/50 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
            {session.user.image ? (
              <Image src={session.user.image} alt="Profile" width={64} height={64} className="w-full h-full rounded-full object-cover" loading="lazy" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{session.user.name || "Learner"}</h2>
            <p className="text-text-muted font-label-mono text-xs uppercase tracking-wider">Free Plan</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <h3 className="font-label-mono text-xs uppercase tracking-widest text-text-muted mb-4">Account Information</h3>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Email Address</p>
              <p className="text-sm text-text-muted">{session.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Member Since</p>
              <p className="text-sm text-text-muted">{joinDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mb-6">
        <ApiKeyForm />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mb-6">
        <div className="p-6 flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-white/5">
          <div>
            <h3 className="font-bold text-text-primary">Monetization & Creator Payouts</h3>
            <p className="text-sm text-text-muted">Manage your Razorpay Linked Account and view your earnings.</p>
          </div>
          <Link href="/settings/monetization" className="px-4 py-2 bg-primary/20 text-primary rounded-md text-sm font-medium hover:bg-primary/30 transition-colors">
            Manage Payouts
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Session Management</h3>
          <p className="text-sm text-text-muted">Sign out of your current session on this device.</p>
        </div>
        <LogoutButton variant="settings" />
      </div>
    </div>
  );
}
