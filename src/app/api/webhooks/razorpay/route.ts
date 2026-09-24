import { NextResponse } from 'next/server';
import { razorpayService } from '@/server/services/razorpay.service';
import { ledgerService } from '@/server/services/ledger.service';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    const isValid = razorpayService.verifyWebhookSignature(body, signature, secret);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const notes = payment.notes || {};
      const type = notes.type;
      
      console.log(`Webhook processing payment ${payment.id} for type ${type}`);

      try {
        if (type === 'CREDIT_PURCHASE') {
          await ledgerService.fulfillCreditPurchase(
            notes.userId,
            payment.order_id,
            payment.id,
            Number(notes.creditAmount)
          );
        } else if (type === 'COURSE_PURCHASE') {
          const result = await ledgerService.fulfillCoursePurchase(
            notes.userId,
            notes.creatorId,
            notes.courseId,
            payment.order_id,
            payment.id,
            payment.amount // in paise
          );

          if (result.success && !result.alreadyProcessed) {
            // Initiate marketplace transfer to creator account if configured
            const creator = await prisma.user.findUnique({ where: { id: notes.creatorId } });
            if (creator?.razorpayAccountId && creator.razorpayAccountId.startsWith('acc_')) {
              await razorpayService.createTransfer({
                paymentId: payment.id,
                accountId: creator.razorpayAccountId,
                amount: result.creatorShare!,
              });
            }
          }
        }
      } catch (err) {
        console.error('Webhook fulfillment failed:', err);
        // Acknowledge receipt to avoid webhook re-delivery loops on logic/fulfillment errors
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
