import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Withdrawal from '@/models/Withdrawal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSig !== signature) {
      console.error('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    await connectDB();

    switch (event.event) {
      // ── Payment captured (backup to verify endpoint) ───────────────────
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const existing = await Transaction.findOne({ razorpayPaymentId: payment.id });
        if (!existing && payment.notes?.userId) {
          const amountInRupees = payment.amount / 100;
          await User.findByIdAndUpdate(payment.notes.userId, {
            $inc: { walletBalance: amountInRupees },
          });
          await Transaction.create({
            userId: payment.notes.userId,
            type: 'deposit',
            amount: amountInRupees,
            description: `Wallet top-up ₹${amountInRupees} (webhook confirmed)`,
            status: 'completed',
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
          });
        }
        break;
      }

      // ── Payout processed (withdrawal completed) ────────────────────────
      case 'payout.processed': {
        const payout = event.payload.payout.entity;
        await Withdrawal.findOneAndUpdate(
          { razorpayPayoutId: payout.id },
          { status: 'completed', processedAt: new Date() }
        );
        break;
      }

      // ── Payout failed (withdrawal failed — refund wallet) ──────────────
      case 'payout.failed': {
        const payout = event.payload.payout.entity;
        const withdrawal = await Withdrawal.findOne({ razorpayPayoutId: payout.id });
        if (withdrawal && withdrawal.status !== 'failed') {
          withdrawal.status = 'failed';
          withdrawal.failureReason = payout.failure_reason || 'Payout failed';
          await withdrawal.save();

          // Refund the amount back to wallet
          await User.findByIdAndUpdate(withdrawal.userId, {
            $inc: { walletBalance: withdrawal.amount },
          });
          await Transaction.create({
            userId: withdrawal.userId,
            type: 'refund',
            amount: withdrawal.amount,
            description: `Withdrawal failed — ₹${withdrawal.amount} refunded to wallet`,
            status: 'completed',
            withdrawalId: withdrawal._id,
          });
        }
        break;
      }

      default:
        // Unhandled events — still return 200 so Razorpay doesn't retry
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
