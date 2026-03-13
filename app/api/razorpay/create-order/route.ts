import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum amount is ₹100' }, { status: 400 });
    }
    if (amount > 500000) {
      return NextResponse.json({ error: 'Maximum amount is ₹5,00,000' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `rcpt_${auth.userId.slice(-8)}_${Date.now()}`,
      notes: {
        userId: auth.userId,
        purpose: 'wallet_topup',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Razorpay order error:', error);
    return NextResponse.json(
      { error: error?.error?.description || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
