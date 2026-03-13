import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Book from '@/models/Book';
import Transaction from '@/models/Transaction';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('userId', 'name email phone address')
      .populate('bookId', 'title author coverImage')
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Admin: confirm delivery
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { orderId, action } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (action === 'confirm_delivery') {
      order.status = 'delivered';
      order.deliveredAt = new Date();
    } else if (action === 'confirm_return') {
      order.status = 'returned';
      order.returnedAt = new Date();

      // Return book to stock
      await Book.findByIdAndUpdate(order.bookId, {
        $inc: { availableCopies: 1 },
        available: true,
      });

      // Free up user
      await User.findByIdAndUpdate(order.userId, { hasActiveBook: false });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await order.save();
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
