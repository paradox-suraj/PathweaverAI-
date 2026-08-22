'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MonitorPlay } from 'lucide-react';

export function StartWatchPartyButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startParty = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/watch-parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        const party = await res.json();
        router.push(`/watch-party/${party.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to start watch party');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={startParty} 
      disabled={loading}
      className="w-full md:w-auto font-medium border-primary/20 hover:bg-primary/10 text-primary"
    >
      <MonitorPlay className="w-5 h-5 mr-2" />
      {loading ? 'Starting...' : 'Start Watch Party'}
    </Button>
  );
}
