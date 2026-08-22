import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function LivePartiesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch active and upcoming parties
  const parties = await prisma.liveParty.findMany({
    where: {
      status: { in: ["LIVE", "SCHEDULED"] },
    },
    include: {
      host: { select: { name: true, image: true } },
      course: { select: { title: true, isPublic: true } },
    },
    orderBy: [
      { status: "asc" }, // LIVE before SCHEDULED usually, wait we can just order by scheduledAt
      { scheduledAt: "asc" }
    ],
  });

  const liveParties = parties.filter(p => p.status === "LIVE");
  const upcomingParties = parties.filter(p => p.status === "SCHEDULED");

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-sp-6 md:p-sp-8 flex flex-col gap-sp-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-sp-4">
        <div>
          <h1 className="font-display-xl text-display-xl text-text-primary">Live Parties</h1>
          <p className="font-body-lg text-body-lg text-text-secondary mt-1">
            Join a live session or host your own watch party.
          </p>
        </div>
        <Link href="/live-parties/host">
          <button className="px-sp-6 py-sp-3 bg-primary-gradient text-white rounded-lg font-medium shadow-glow-primary hover:scale-[1.02] transition-transform flex items-center gap-2">
            <span className="material-symbols-outlined">add_circle</span>
            Host a Party
          </button>
        </Link>
      </div>

      {liveParties.length > 0 && (
        <section>
          <h2 className="font-headline-md text-headline-md text-text-primary flex items-center gap-2 mb-sp-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
            </span>
            Happening Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sp-6">
            {liveParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-headline-md text-headline-md text-text-primary mb-sp-4">Upcoming Parties</h2>
        {upcomingParties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sp-6">
            {upcomingParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        ) : (
          <div className="text-center p-sp-10 border border-white/10 rounded-xl bg-surface-2/30">
            <span className="material-symbols-outlined text-4xl text-text-muted mb-2">event_busy</span>
            <p className="text-text-secondary">No upcoming parties right now.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function PartyCard({ party }: { party: any }) {
  const isLive = party.status === "LIVE";
  
  return (
    <div className="bg-surface-glass border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
      <div className="p-sp-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {party.host.image ? (
              <img src={party.host.image} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
            )}
            <span className="text-sm font-medium text-text-primary">{party.host.name || 'Anonymous'}</span>
          </div>
          {isLive ? (
             <span className="px-2 py-1 text-xs font-bold rounded bg-error/20 text-error uppercase">Live</span>
          ) : (
             <span className="px-2 py-1 text-xs font-bold rounded bg-surface-variant text-text-secondary uppercase">
               {party.scheduledAt ? format(new Date(party.scheduledAt), "MMM d, h:mm a") : "Scheduled"}
             </span>
          )}
        </div>
        
        <h3 className="font-headline-sm text-headline-sm text-text-primary line-clamp-1 mb-1">{party.title}</h3>
        <p className="text-sm text-primary mb-3 line-clamp-1">{party.course.title}</p>
        
        {party.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">{party.description}</p>
        )}
      </div>
      
      <div className="p-sp-4 border-t border-white/10 bg-surface-2/30 mt-auto">
        <Link href={isLive ? `/watch-party/${party.id}` : '#'}>
          <button 
            disabled={!isLive}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${isLive ? 'bg-primary text-white hover:bg-primary-600' : 'bg-surface-variant text-text-muted cursor-not-allowed'}`}
          >
            {isLive ? 'Join Party' : 'Waiting to start'}
          </button>
        </Link>
      </div>
    </div>
  );
}
