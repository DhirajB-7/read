import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // ── Verify HMAC signature ─────────────────────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature — possible fraud attempt' }, { status: 400 });
    }

    // ── Idempotency: check if this payment_id was already processed ───────
    await connectDB();
    const existing = await Transaction.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existing) {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 409 });
    }

    // ── Credit wallet ─────────────────────────────────────────────────────
    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await Transaction.create({
      userId: auth.userId,
      type: 'deposit',
      amount,
      description: `Wallet top-up ₹${amount} via Razorpay`,
      status: 'completed',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    return NextResponse.json({ success: true, walletBalance: user.walletBalance });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: 'Server error during verification' }, { status: 500 });
  }
}
