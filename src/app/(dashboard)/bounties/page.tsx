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
import { useToast } from '@/components/ui/use-toast';
import { Coins, Loader2, Target, Plus } from 'lucide-react';
import { fundBounty } from '@/server/actions/monetization';

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create Form state
  const [questionText, setQuestionText] = useState('');
  const [rewardXP, setRewardXP] = useState('');
  const [rewardCredits, setRewardCredits] = useState('');
  const [creating, setCreating] = useState(false);

  // Fund Form state
  const [bountyId, setBountyId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

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
    setCreating(true);

    try {
      const credits = rewardCredits ? parseInt(rewardCredits) : 0;
      
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          rewardXP: parseInt(rewardXP),
          rewardCredits: credits,
        }),
      });

      if (res.ok) {
        const newBounty = await res.json();
        
        // If credits were added during creation, fund it now
        if (credits > 0) {
          try {
            await fundBounty(newBounty.id, credits);
          } catch (fundErr: any) {
            toast({
              variant: 'destructive',
              title: 'Bounty created, but funding failed',
              description: fundErr.message || 'Make sure you have enough credits in your wallet.',
            });
          }
        }

        setQuestionText('');
        setRewardXP('');
        setRewardCredits('');
        fetchBounties();
        toast({ title: 'Bounty Posted!' });
      } else {
        const err = await res.json();
        toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to create bounty' });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred' });
    } finally {
      setCreating(false);
    }
  };

  const handleFund = async () => {
    try {
      setFunding(true);
      const parsedAmount = parseInt(fundAmount, 10);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Please enter a valid amount of credits');
      }

      await fundBounty(bountyId, parsedAmount);
      
      toast({
        title: 'Bounty Funded!',
        description: `Successfully added ${parsedAmount} credits to the bounty.`,
      });
      setBountyId('');
      setFundAmount('');
      fetchBounties();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error Funding Bounty',
        description: err.message,
      });
    } finally {
      setFunding(false);
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
            <p className="text-muted-foreground flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</p>
          ) : bounties.length === 0 ? (
            <p className="text-neutral-500">No open bounties right now. Be the first to ask a question!</p>
          ) : (
            bounties.map((bounty) => (
              <Card key={bounty.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start text-lg">
                    <span>{bounty.questionText}</span>
                    <div className="flex gap-2">
                      <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">
                        {bounty.rewardXP} XP
                      </span>
                      {bounty.rewardCredits > 0 && (
                        <span className="text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {bounty.rewardCredits}
                        </span>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Asked by {bounty.creator?.name || 'Anonymous'} • {new Date(bounty.createdAt).toLocaleDateString()}
                    <br/>
                    ID: <span className="font-mono text-xs">{bounty.id}</span>
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

        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Place a Bounty</CardTitle>
              <CardDescription>
                Struggling with a topic? Offer XP and Credits to get human help.
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Extra Reward (Credits)</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={rewardCredits}
                      onChange={(e) => setRewardCredits(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Post Bounty
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Fund a Bounty
              </CardTitle>
              <CardDescription>
                Increase the reward for any existing question using your wallet credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bounty ID</label>
                <Input 
                  placeholder="e.g. cm0abc123..." 
                  value={bountyId}
                  onChange={(e) => setBountyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    placeholder="100" 
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="pl-9"
                    min="1"
                  />
                </div>
              </div>
              <Button onClick={handleFund} disabled={funding || !bountyId || !fundAmount} variant="secondary" className="w-full">
                {funding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Credits
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
