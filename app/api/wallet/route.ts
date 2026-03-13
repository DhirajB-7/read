import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getAuthUserFromRequest } from '@/lib/auth';

const SECURITY_DEPOSIT = 500;

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const [user, transactions] = await Promise.all([
      User.findById(auth.userId).select('walletBalance hasActiveBook'),
      Transaction.find({ userId: auth.userId }).sort({ createdAt: -1 }).limit(20),
    ]);

    return NextResponse.json({ walletBalance: user?.walletBalance, transactions });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { amount, razorpayPaymentId, razorpayOrderId } = await req.json();

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum deposit is ₹100' }, { status: 400 });
    }

    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.walletBalance += amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount,
      description: `Wallet top-up via Razorpay`,
      razorpayPaymentId,
      razorpayOrderId,
    });

    return NextResponse.json({ success: true, walletBalance: user.walletBalance });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
