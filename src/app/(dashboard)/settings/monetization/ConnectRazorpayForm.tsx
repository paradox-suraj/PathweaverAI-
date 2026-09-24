'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { linkRazorpayAccount } from '@/server/actions/monetization';
import { Loader2 } from 'lucide-react';

export function ConnectRazorpayForm() {
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    try {
      setLoading(true);
      await linkRazorpayAccount(accountId);
      toast({
        title: 'Account Connected',
        description: 'Your Razorpay account has been successfully linked.',
      });
      setAccountId('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleConnect} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="accountId" className="text-sm font-medium">Razorpay Route Account ID or Payment Link</label>
        <Input 
          id="accountId"
          placeholder="e.g. acc_XXX... or https://razorpay.me/@..." 
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          If you have a Razorpay Route account, paste the ID to receive automated 80% splits. Alternatively, you can paste your personal Razorpay.me link to collect direct payments manually.
        </p>
      </div>
      
      <div className="p-4 bg-muted border rounded-md text-sm">
        <h4 className="font-semibold mb-2">Terms & Conditions (Payment Commission)</h4>
        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
          <li><strong>80% Revenue Share:</strong> You will receive 80% of the total revenue from course sales and live party tickets.</li>
          <li><strong>20% Platform Fee:</strong> PathWeaver AI retains a 20% platform fee to cover hosting, streaming, and operational costs.</li>
          <li><strong>Direct Payouts:</strong> Earnings are routed directly to your linked Razorpay account upon successful transaction.</li>
          <li>By connecting your account, you agree to these standard platform commission terms.</li>
        </ul>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !accountId}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Agree & Connect Account
      </Button>
    </form>
  );
}
