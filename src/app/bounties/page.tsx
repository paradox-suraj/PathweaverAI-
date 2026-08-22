'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [rewardXP, setRewardXP] = useState('');

  const fetchBounties = async () => {
    try {
      const res = await fetch('/api/bounties?status=OPEN');
      const data = await res.json();
      setBounties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  const createBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || !rewardXP) return;

    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          rewardXP: parseInt(rewardXP),
        }),
      });

      if (res.ok) {
        setQuestionText('');
        setRewardXP('');
        fetchBounties();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create bounty');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Community Bounties</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Open Bounties</h2>
          {loading ? (
            <p>Loading...</p>
          ) : bounties.length === 0 ? (
            <p className="text-neutral-500">No open bounties right now. Be the first to ask a question!</p>
          ) : (
            bounties.map((bounty) => (
              <Card key={bounty.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start text-lg">
                    <span>{bounty.questionText}</span>
                    <span className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm">
                      {bounty.rewardXP} XP
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Asked by {bounty.creator?.name || 'Anonymous'} • {new Date(bounty.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400">
                    {bounty._count?.answers || 0} answer(s)
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href={`/bounties/${bounty.id}`}>
                    <Button variant="outline">View & Answer</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Place a Bounty</CardTitle>
              <CardDescription>
                Struggling with a topic? Spend your XP to get human help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createBounty} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question</label>
                  <Textarea
                    placeholder="What do you need explained?"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reward (XP)</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={rewardXP}
                    onChange={(e) => setRewardXP(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Post Bounty
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
