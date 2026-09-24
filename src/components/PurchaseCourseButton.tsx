'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { IndianRupee, Loader2, Lock } from 'lucide-react';
import { createCoursePurchaseOrder, verifyAndFulfillPayment } from '@/server/actions/monetization';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

export function PurchaseCourseButton({ courseId, price, creatorId }: { courseId: string; price: number; creatorId: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Payment gateway is not configured on this environment.");
      }
      
      const order = await createCoursePurchaseOrder(courseId);

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'PathWeaver AI Premium Course',
        description: `Unlock Course Access`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            await verifyAndFulfillPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              {
                type: 'COURSE_PURCHASE',
                userId: session?.user?.id as string,
                courseId: courseId,
                creatorId: creatorId,
              }
            );

            toast({
              title: 'Purchase Successful!',
              description: 'You now have full access to this course.',
            });
            // verifyAndFulfillPayment already calls revalidatePath, so the UI will update
          } catch (err: any) {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: err.message,
            });
          }
        },
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },
        theme: {
          color: '#0f172a',
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
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button 
        size="lg" 
        className="w-full font-medium bg-primary-gradient border border-white/10 hover:shadow-glow-primary transition-all hover:scale-105 active:scale-95"
        onClick={handlePurchase}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Lock className="w-5 h-5 mr-2" />
        )}
        Unlock Course for ₹{(price / 100).toFixed(2)}
      </Button>
    </>
  );
}
