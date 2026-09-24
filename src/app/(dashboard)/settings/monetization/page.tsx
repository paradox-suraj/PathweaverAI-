import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ConnectRazorpayForm } from './ConnectRazorpayForm';

export default async function MonetizationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorEarnings: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  const isConnected = !!user?.razorpayAccountId;
  
  // Calculate total earnings
  const totalEarnings = await prisma.creatorEarning.aggregate({
    where: { creatorId: session.user.id, status: 'PAID' },
    _sum: { creatorAmount: true }
  });
  
  const totalINR = (totalEarnings._sum.creatorAmount || 0) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Monetization & Payouts</h3>
        <p className="text-sm text-muted-foreground">
          Manage your creator payouts, view your earnings, and connect your Razorpay account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Razorpay Linked Account
              {isConnected ? (
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connect your account to receive payouts directly to your bank account when users buy your premium content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="text-sm font-mono bg-muted p-3 rounded-md">
                  Account ID: {user?.razorpayAccountId}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Your account is manually linked by the platform administrator for the MVP.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 dark:text-amber-400 text-sm mb-4">
                  To start earning, you must link a Razorpay Route Account.
                </div>
                <ConnectRazorpayForm />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>Your all-time earnings after platform fees.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <h2 className="text-5xl font-bold flex items-center">
              <IndianRupee className="h-10 w-10 text-muted-foreground mr-1" />
              {totalINR.toFixed(2)}
            </h2>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>Your 5 most recent earnings from premium courses and live parties.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user?.creatorEarnings && user.creatorEarnings.length > 0 ? (
              user.creatorEarnings.map(earning => (
                <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {earning.sourceType === 'COURSE' ? 'Course Sale' : 'Live Party Ticket'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      + ₹{(earning.creatorAmount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {earning.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                No earnings yet. Create a premium course to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
