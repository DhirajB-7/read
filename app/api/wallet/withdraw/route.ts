import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Withdrawal from '@/models/Withdrawal';
import { getAuthUserFromRequest } from '@/lib/auth';

const SECURITY_DEPOSIT = 500;
const MIN_WITHDRAWAL = 100;

// Validate UPI ID format
function isValidUPI(upiId: string): boolean {
  return /^[\w.\-_]{3,}@[a-zA-Z]{3,}$/.test(upiId);
}

// Validate IFSC format
function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { amount, method, upiId, upiName, accountNumber, ifscCode, accountHolderName, bankName } = body;

    // ── Basic validations ──────────────────────────────────────────────────
    if (!amount || amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}` }, { status: 400 });
    }
    if (!method || !['upi', 'bank_transfer'].includes(method)) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 });
    }

    // ── Method-specific validations ─────────────────────────────────────
    if (method === 'upi') {
      if (!upiId || !upiName) {
        return NextResponse.json({ error: 'UPI ID and name are required' }, { status: 400 });
      }
      if (!isValidUPI(upiId)) {
        return NextResponse.json({ error: 'Invalid UPI ID format (e.g. name@upi)' }, { status: 400 });
      }
    }
    if (method === 'bank_transfer') {
      if (!accountNumber || !ifscCode || !accountHolderName) {
        return NextResponse.json({ error: 'Account number, IFSC and holder name are required' }, { status: 400 });
      }
      if (!isValidIFSC(ifscCode.toUpperCase())) {
        return NextResponse.json({ error: 'Invalid IFSC code format' }, { status: 400 });
      }
      if (accountNumber.length < 8 || accountNumber.length > 18) {
        return NextResponse.json({ error: 'Invalid account number length' }, { status: 400 });
      }
    }

    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ── Business rules ─────────────────────────────────────────────────────
    if (user.hasActiveBook) {
      return NextResponse.json(
        { error: 'Return your active book before withdrawing' },
        { status: 400 }
      );
    }

    const withdrawable = user.walletBalance - SECURITY_DEPOSIT;
    if (withdrawable < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Insufficient withdrawable balance. Available: ₹${Math.max(0, withdrawable)}` },
        { status: 400 }
      );
    }
    if (amount > withdrawable) {
      return NextResponse.json(
        { error: `Max withdrawable is ₹${withdrawable}` },
        { status: 400 }
      );
    }

    // ── Deduct wallet immediately (hold funds) ─────────────────────────────
    user.walletBalance -= amount;
    await user.save();

    // ── Create withdrawal request ──────────────────────────────────────────
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      method,
      ...(method === 'upi' ? { upiId: upiId.toLowerCase(), upiName } : {}),
      ...(method === 'bank_transfer'
        ? {
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
            accountHolderName,
            bankName: bankName || '',
          }
        : {}),
      status: 'pending',
    });

    // ── Record transaction ─────────────────────────────────────────────────
    await Transaction.create({
      userId: user._id,
      type: 'withdrawal_request',
      amount: -amount,
      description:
        method === 'upi'
          ? `Withdrawal ₹${amount} → UPI ${upiId}`
          : `Withdrawal ₹${amount} → Bank A/C ${accountNumber?.slice(-4).padStart(accountNumber.length, '•')}`,
      status: 'pending',
      withdrawalId: withdrawal._id,
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal._id,
        amount,
        method,
        status: 'pending',
        estimatedTime: method === 'upi' ? '30 minutes – 2 hours' : '1–2 business days',
      },
      walletBalance: user.walletBalance,
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET — user's withdrawal history
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const withdrawals = await Withdrawal.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ withdrawals });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
