'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, ArrowUpRight, ArrowDownRight, IndianRupee, ExternalLink } from 'lucide-react';
import { createCreditPurchaseOrder, verifyAndFulfillPayment } from '@/server/actions/monetization';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

const CREDIT_PACKS = [
  { amount: 100, price: 100, bonus: 0 },
  { amount: 500, price: 500, bonus: 50 },
  { amount: 1000, price: 1000, bonus: 150 },
];

export default function WalletPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loadingPack, setLoadingPack] = useState<number | null>(null);

  const handlePurchase = async (packAmount: number, priceINR: number) => {
    try {
      setLoadingPack(packAmount);
      
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Payment gateway is not configured on this environment.");
      }

      const order = await createCreditPurchaseOrder(packAmount);

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'PathWeaver AI',
        description: `Purchase ${packAmount} Credits`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            await verifyAndFulfillPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              {
                type: 'CREDIT_PURCHASE',
                userId: session?.user?.id as string,
                creditAmount: packAmount,
              }
            );

            toast({
              title: 'Success!',
              description: `Added ${packAmount} credits to your wallet.`,
            });
          } catch (err: any) {
            toast({
              variant: 'destructive',
              title: 'Payment Verification Failed',
              description: err.message,
            });
          }
        },
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },
        theme: {
          color: '#0f172a', // Slate 900
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: response.error.description,
        });
      });
      rzp1.open();

    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-1">Manage your PathWeaver Credits and transaction history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="col-span-1 md:col-span-3 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
              <Coins className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Available Balance</p>
            <h2 className="text-5xl font-bold">0 <span className="text-2xl text-muted-foreground font-normal">Credits</span></h2>
          </CardContent>
        </Card>

        {/* Purchase Options */}
        {CREDIT_PACKS.map((pack) => (
          <Card key={pack.amount} className="flex flex-col relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
            {pack.bonus > 0 && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                +{pack.bonus} Bonus
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                {pack.amount + pack.bonus} Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center flex-1 flex items-end justify-center pb-6 pt-4">
              <div className="flex items-center text-3xl font-bold">
                <IndianRupee className="h-6 w-6 mr-1 text-muted-foreground" />
                {pack.price}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(pack.amount + pack.bonus, pack.price)}
                disabled={loadingPack !== null}
              >
                {loadingPack === pack.amount + pack.bonus ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Buy Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="pt-6">
        <h3 className="text-xl font-bold tracking-tight mb-4">Transaction History</h3>
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y">
              <div className="p-8 text-center text-muted-foreground">
                <p>No transactions yet.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
