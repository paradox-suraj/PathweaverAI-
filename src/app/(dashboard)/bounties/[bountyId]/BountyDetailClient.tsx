'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function BountyDetailClient({
  bounty,
  isCreator,
  currentUserId,
}: {
  bounty: any;
  isCreator: boolean;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitAnswer = async () => {
    if (!answerText) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerText }),
      });
      if (res.ok) {
        setAnswerText('');
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit answer');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const acceptAnswer = async (answerId: string) => {
    if (!confirm('Are you sure you want to accept this answer? This will award the XP and close the bounty.')) return;
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/answers/${answerId}/accept`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to accept answer');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">{bounty.questionText}</CardTitle>
              <CardDescription>
                Asked by {bounty.creator.name || 'Anonymous'} • {new Date(bounty.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-full text-lg">
                {bounty.rewardXP} XP
              </span>
              <span className="text-sm mt-2 font-medium bg-neutral-800 px-2 py-1 rounded">
                Status: {bounty.status}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Answers ({bounty.answers.length})</h3>
        <div className="space-y-4">
          {bounty.answers.map((answer: any) => (
            <Card key={answer.id} className={answer.isAccepted ? 'border-green-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{answer.answerText}</p>
                    <p className="text-sm text-neutral-400 mt-4">
                      Answered by {answer.author.name || 'Anonymous'} • {new Date(answer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {answer.isAccepted && (
                    <div className="text-green-500 flex items-center ml-4">
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      <span className="font-bold">Accepted</span>
                    </div>
                  )}
                  {isCreator && bounty.status === 'OPEN' && !answer.isAccepted && (
                    <div className="ml-4">
                      <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10" onClick={() => acceptAnswer(answer.id)}>
                        Accept Answer
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {bounty.answers.length === 0 && (
            <p className="text-neutral-500">No answers yet.</p>
          )}
        </div>
      </div>

      {bounty.status === 'OPEN' && currentUserId !== bounty.creatorId && (
        <Card>
          <CardHeader>
            <CardTitle>Submit an Answer</CardTitle>
            <CardDescription>Earn {bounty.rewardXP} XP if your answer is accepted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write your explanation here..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="min-h-[150px] mb-4"
            />
            <Button onClick={submitAnswer} disabled={submitting || !answerText}>
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
