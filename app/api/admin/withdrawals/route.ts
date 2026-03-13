import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const query: any = {};
    if (status !== 'all') query.status = status;

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    return NextResponse.json({ withdrawals });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { withdrawalId, action, reason } = await req.json();

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

    if (!['pending', 'processing'].includes(withdrawal.status)) {
      return NextResponse.json({ error: `Cannot update a ${withdrawal.status} withdrawal` }, { status: 400 });
    }

    if (action === 'mark_processing') {
      withdrawal.status = 'processing';
      await withdrawal.save();
      return NextResponse.json({ success: true, withdrawal });
    }

    if (action === 'mark_completed') {
      withdrawal.status = 'completed';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Update pending transaction to completed
      await Transaction.findOneAndUpdate(
        { withdrawalId: withdrawal._id, status: 'pending' },
        { status: 'completed', description: `Withdrawal ₹${withdrawal.amount} paid → ${withdrawal.method === 'upi' ? withdrawal.upiId : `A/C ••••${withdrawal.accountNumber?.slice(-4)}`}` }
      );

      return NextResponse.json({ success: true, withdrawal });
    }

    if (action === 'reject') {
      const refundReason = reason || 'Rejected by admin';
      withdrawal.status = 'rejected';
      withdrawal.failureReason = refundReason;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Refund wallet
      await User.findByIdAndUpdate(withdrawal.userId, {
        $inc: { walletBalance: withdrawal.amount },
      });

      // Update transaction + create refund
      await Transaction.findOneAndUpdate(
        { withdrawalId: withdrawal._id, status: 'pending' },
        { status: 'failed' }
      );
      await Transaction.create({
        userId: withdrawal.userId,
        type: 'refund',
        amount: withdrawal.amount,
        description: `Withdrawal rejected — ₹${withdrawal.amount} refunded (${refundReason})`,
        status: 'completed',
        withdrawalId: withdrawal._id,
      });

      return NextResponse.json({ success: true, withdrawal });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin withdrawal update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
