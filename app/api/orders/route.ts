import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Book from '@/models/Book';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import { getAuthUserFromRequest } from '@/lib/auth';

const SECURITY_DEPOSIT = 500;
const RENTAL_FEE = 100;
const DELIVERY_FEE = 20;

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { bookId } = await req.json();
    if (!bookId) return NextResponse.json({ error: 'Book ID required' }, { status: 400 });

    const [user, book] = await Promise.all([
      User.findById(auth.userId),
      Book.findById(bookId),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    if (!book.available || book.availableCopies < 1) {
      return NextResponse.json({ error: 'Book not available' }, { status: 400 });
    }
    if (user.hasActiveBook) {
      return NextResponse.json({ error: 'You already have an active rental' }, { status: 400 });
    }

    const deliveryCharge = user.isFirstOrder ? 0 : DELIVERY_FEE;
    const rentalCharge = RENTAL_FEE;
    const totalCharge = rentalCharge + deliveryCharge;

    // Balance gate: after charge, must still have ≥ SECURITY_DEPOSIT
    if (user.walletBalance - totalCharge < SECURITY_DEPOSIT) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. Need ₹${SECURITY_DEPOSIT + totalCharge} minimum.` },
        { status: 400 }
      );
    }

    // Deduct wallet
    user.walletBalance -= totalCharge;
    user.hasActiveBook = true;
    user.isFirstOrder = false;

    // Create order
    const order = await Order.create({
      userId: user._id,
      bookId: book._id,
      status: 'pending_delivery',
      rentalCharge,
      deliveryCharge,
      totalCharge,
    });

    // Create transactions
    const txns = [
      Transaction.create({
        userId: user._id,
        type: 'rental',
        amount: -rentalCharge,
        description: `Rental fee for "${book.title}"`,
      }),
    ];

    if (deliveryCharge > 0) {
      txns.push(
        Transaction.create({
          userId: user._id,
          type: 'delivery',
          amount: -deliveryCharge,
          description: `Delivery fee for "${book.title}"`,
        })
      );
    }

    book.availableCopies -= 1;
    if (book.availableCopies === 0) book.available = false;

    await Promise.all([user.save(), book.save(), ...txns]);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Borrow error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const orders = await Order.find({ userId: auth.userId })
      .populate('bookId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
