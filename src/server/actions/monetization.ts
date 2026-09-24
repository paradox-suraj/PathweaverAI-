'use server';

import { auth } from '@/auth';
import { razorpayService } from '@/server/services/razorpay.service';
import { prisma } from '@/lib/prisma';
import { ledgerService } from '@/server/services/ledger.service';
import { revalidatePath } from 'next/cache';

/**
 * Initiates a purchase for PathWeaver Credits
 */
export async function createCreditPurchaseOrder(creditAmount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const amountInPaise = creditAmount * 100;
  if (amountInPaise < 100) throw new Error('Minimum amount is 100 paise');

  const order = await razorpayService.createOrder({
    amount: amountInPaise,
    receipt: `credit_${session.user.id}_${Date.now()}`,
    notes: {
      userId: session.user.id,
      type: 'CREDIT_PURCHASE',
      creditAmount: creditAmount.toString(),
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Initiates a purchase for a Premium Course
 */
export async function createCoursePurchaseOrder(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || !course.price) {
    throw new Error('Course not found or is free.');
  }

  if (course.price < 100) {
    throw new Error('Minimum amount is 100 paise');
  }

  const order = await razorpayService.createOrder({
    amount: course.price, // assuming price is in paise
    receipt: `course_${courseId}_${session.user.id}_${Date.now()}`,
    notes: {
      userId: session.user.id,
      type: 'COURSE_PURCHASE',
      courseId: courseId,
      creatorId: course.userId,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Verifies the payment on the frontend and handles fulfillment immediately 
 * (Webhook also runs as a fallback/source of truth)
 */
export async function verifyAndFulfillPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  metadata: {
    type: 'CREDIT_PURCHASE' | 'COURSE_PURCHASE';
    userId: string;
    courseId?: string;
    creditAmount?: number;
    creatorId?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== metadata.userId) {
    throw new Error('Unauthorized');
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error('Missing payment details');
  }

  const isValid = razorpayService.verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    throw new Error('Invalid payment signature');
  }

  if (metadata.type === 'CREDIT_PURCHASE' && metadata.creditAmount) {
    await ledgerService.fulfillCreditPurchase(
      metadata.userId,
      razorpayOrderId,
      razorpayPaymentId,
      metadata.creditAmount
    );
    revalidatePath('/wallet');
  } else if (metadata.type === 'COURSE_PURCHASE' && metadata.courseId && metadata.creatorId) {
    const course = await prisma.course.findUnique({ where: { id: metadata.courseId }});
    if (!course || !course.price) throw new Error('Invalid course');

    const result = await ledgerService.fulfillCoursePurchase(
      metadata.userId,
      metadata.creatorId,
      metadata.courseId,
      razorpayOrderId,
      razorpayPaymentId,
      course.price
    );

    if (result.success && !result.alreadyProcessed) {
      // 3. Razorpay Route Split (transfer to creator)
      const creator = await prisma.user.findUnique({ where: { id: metadata.creatorId }});
      if (creator?.razorpayAccountId && creator.razorpayAccountId.startsWith('acc_')) {
        try {
          await razorpayService.createTransfer({
            paymentId: razorpayPaymentId,
            accountId: creator.razorpayAccountId,
            amount: result.creatorShare!,
          });
        } catch (err) {
          console.error('Failed to route transfer:', err);
          // Purchase is still considered successful.
        }
      }
    }
    revalidatePath(`/courses/${metadata.courseId}`);
  }

  return { success: true };
}

/**
 * Funds a bounty using Wallet Credits
 */
export async function fundBounty(bountyId: string, creditAmount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (creditAmount <= 0) throw new Error('Amount must be positive');

  const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
  if (!bounty) throw new Error('Bounty not found');

  // Deduct from wallet and add to bounty atomically
  await ledgerService.fundBountyAtomic(session.user.id, bountyId, creditAmount);

  revalidatePath(`/bounties`);
  revalidatePath(`/wallet`);
  
  return { success: true };
}

/**
 * Links a creator's Razorpay Route account ID.
 */
export async function linkRazorpayAccount(accountId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  const trimmed = accountId.trim();
  
  if (!trimmed.startsWith('acc_') && !trimmed.includes('razorpay.me/')) {
    throw new Error('Invalid input. Please provide a Razorpay Account ID (acc_...) or a Razorpay Payment Page URL (https://razorpay.me/...)');
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { razorpayAccountId: trimmed }
  });

  revalidatePath('/settings/monetization');
  return { success: true };
}
