import { prisma } from '@/lib/prisma';
import { type Wallet, type WalletTransaction } from '../../../generated/prisma';
import crypto from "crypto";

export class LedgerService {
  /**
   * Safely adds or subtracts credits from a user's wallet using a database transaction.
   * Ensures the balance never drops below zero.
   * 
   * @param userId The ID of the user.
   * @param amount The amount to add (positive) or subtract (negative).
   * @param type The transaction type (e.g., 'CREDIT_PURCHASE', 'BOUNTY_FUND').
   * @param referenceId Optional ID linking to the external source (Razorpay order ID, Bounty ID, etc.)
   */
  async processTransaction(
    userId: string,
    amount: number,
    type: string,
    referenceId?: string
  ): Promise<WalletTransaction> {
    if (amount === 0) {
      throw new Error('Transaction amount cannot be zero.');
    }

    return await prisma.$transaction(async (tx) => {
      // Anomaly Detection: High-frequency transaction check
      const recentTxCount = await tx.walletTransaction.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 60000) } // Last 60 seconds
        }
      });
      if (recentTxCount > 10) {
        console.error(`[SECURITY] Anomaly detected: High frequency transactions for user ${userId}. Count: ${recentTxCount}`);
        throw new Error("Transaction flagged for suspicious activity. Please wait.");
      }

      // 1. Get or create wallet. We use `findUnique` with locking if supported, 
      // but Prisma's increment/decrement is atomic at the DB level.
      let wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, creditBalance: 0 },
        });
      }

      const balanceBefore = wallet.creditBalance;
      const balanceAfter = balanceBefore + amount;

      if (balanceAfter < 0) {
        throw new Error('Insufficient funds.');
      }

      // 2. Update wallet balance atomically using Prisma's `increment`
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          creditBalance: {
            increment: amount,
          },
        },
      });

      // 3. Create the ledger record
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          referenceId,
        },
      });

      // 4. Create immutable audit log
      const payload = JSON.stringify({ userId, type, amount, balanceAfter, referenceId, timestamp: new Date().toISOString() });
      const secret = process.env.AUDIT_SECRET || "pathweaver_audit_fallback_key";
      const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      
      await tx.auditLog.create({
        data: {
          userId,
          action: `LEDGER_PROCESS_${type}`,
          details: JSON.parse(payload),
          hash,
        }
      });

      return transaction;
    });
  }

  /**
   * Atomically funds a bounty, debiting the wallet and crediting the bounty.
   */
  async fundBountyAtomic(userId: string, bountyId: string, amount: number) {
    if (amount <= 0) throw new Error('Transaction amount must be positive.');

    return await prisma.$transaction(async (tx) => {
      // Anomaly Detection
      const recentTxCount = await tx.walletTransaction.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 60000) } }
      });
      if (recentTxCount > 10) throw new Error("Suspicious activity detected. Please wait.");

      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId, creditBalance: 0 } });
      }

      const balanceBefore = wallet.creditBalance;
      const balanceAfter = balanceBefore - amount;
      if (balanceAfter < 0) {
        throw new Error('Insufficient funds.');
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { creditBalance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'BOUNTY_FUND',
          amount: -amount,
          balanceBefore,
          balanceAfter,
          referenceId: bountyId,
        },
      });

      await tx.bounty.update({
        where: { id: bountyId },
        data: { rewardCredits: { increment: amount } },
      });
      
      // Audit
      const payload = JSON.stringify({ userId, action: 'BOUNTY_FUND', amount: -amount, bountyId, timestamp: new Date().toISOString() });
      const secret = process.env.AUDIT_SECRET || "pathweaver_audit_fallback_key";
      await tx.auditLog.create({
        data: {
          userId,
          action: 'BOUNTY_FUND',
          details: JSON.parse(payload),
          hash: crypto.createHmac("sha256", secret).update(payload).digest("hex"),
        }
      });

      return { success: true };
    });
  }

  /**
   * Atomically fulfills a Razorpay credit purchase
   */
  async fulfillCreditPurchase(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    creditAmount: number,
  ) {
    return await prisma.$transaction(async (tx) => {
      // Idempotency check inside transaction
      const existingTx = await tx.razorpayTransaction.findUnique({
        where: { razorpayPaymentId },
      });
      if (existingTx && existingTx.status === 'CAPTURED') return { success: true, alreadyProcessed: true };

      // 1. Record transaction
      await tx.razorpayTransaction.create({
        data: {
          razorpayOrderId,
          razorpayPaymentId,
          amount: creditAmount * 100,
          type: 'CREDIT_PURCHASE',
          status: 'CAPTURED',
        },
      });

      // 2. Add credits to wallet
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId, creditBalance: 0 } });
      }

      const balanceBefore = wallet.creditBalance;
      const balanceAfter = balanceBefore + creditAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { creditBalance: { increment: creditAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'CREDIT_PURCHASE',
          amount: creditAmount,
          balanceBefore,
          balanceAfter,
          referenceId: razorpayPaymentId,
        },
      });

      return { success: true, alreadyProcessed: false };
    });
  }

  /**
   * Atomically fulfills a Razorpay course purchase
   */
  async fulfillCoursePurchase(
    userId: string,
    creatorId: string,
    courseId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    coursePrice: number,
  ) {
    return await prisma.$transaction(async (tx) => {
      const existingTx = await tx.razorpayTransaction.findUnique({
        where: { razorpayPaymentId },
      });
      if (existingTx && existingTx.status === 'CAPTURED') return { success: true, alreadyProcessed: true };

      // 1. Record transaction
      await tx.razorpayTransaction.create({
        data: {
          razorpayOrderId,
          razorpayPaymentId,
          amount: coursePrice,
          type: 'COURSE_PURCHASE',
          status: 'CAPTURED',
        },
      });

      // 2. Grant Access
      await tx.purchase.create({
        data: {
          userId,
          courseId,
          amountPaid: coursePrice,
        }
      });

      // 3. Record Earnings
      const platformFee = Math.round(coursePrice * 0.20);
      const creatorShare = coursePrice - platformFee;

      const earning = await tx.creatorEarning.create({
        data: {
          creatorId,
          sourceType: 'COURSE',
          sourceId: courseId,
          grossAmount: coursePrice,
          platformFee,
          paymentFee: 0,
          creatorAmount: creatorShare,
          status: 'PAID',
        }
      });

      return { success: true, alreadyProcessed: false, earningId: earning.id, creatorShare };
    });
  }

  /**
   * Gets the user's current wallet balance, creating a wallet if one doesn't exist.
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Create empty wallet lazily
      const newWallet = await prisma.wallet.create({
        data: { userId, creditBalance: 0 },
      });
      return newWallet.creditBalance;
    }

    return wallet.creditBalance;
  }

  /**
   * Gets the user's transaction history.
   */
  async getHistory(userId: string, limit = 50, skip = 0): Promise<WalletTransaction[]> {
    return await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }
}

export const ledgerService = new LedgerService();
