import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payment features will fail.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export class RazorpayService {
  /**
   * Creates a Razorpay Order for purchasing a course, live party, or credits.
   */
  async createOrder({
    amount,
    currency = 'INR',
    receipt,
    notes = {},
  }: {
    amount: number; // in paise (e.g. 10000 = ₹100.00)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    const options = {
      amount,
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);
    return order;
  }

  /**
   * Automatically splits a captured payment and sends a portion to a creator's linked account.
   */
  async createTransfer({
    paymentId,
    accountId,
    amount, // The amount to transfer to the creator (in paise)
    currency = 'INR',
    notes = {},
  }: {
    paymentId: string;
    accountId: string;
    amount: number;
    currency?: string;
    notes?: Record<string, string>;
  }) {
    const transferOptions = {
      transfers: [
        {
          account: accountId,
          amount,
          currency,
          notes,
          linked_account_notes: ['courseId', 'livePartyId'],
          on_hold: false,
        },
      ],
    };

    const transfer = await razorpay.payments.transfer(paymentId, transferOptions);
    return transfer;
  }

  /**
   * Verifies the signature from Razorpay checkout success.
   */
  verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  }: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('Razorpay secret is not configured');
    const body = orderId + '|' + paymentId;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');
      
    return expectedSignature === signature;
  }

  /**
   * Verifies webhook signature.
   */
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
      
    return expectedSignature === signature;
  }
}

export const razorpayService = new RazorpayService();
