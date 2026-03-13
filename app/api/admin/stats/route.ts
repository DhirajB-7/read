import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Book from '@/models/Book';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();

    const [totalUsers, totalBooks, totalOrders, activeOrders, revenue] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      Book.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending_delivery', 'delivered'] } }),
      Transaction.aggregate([
        { $match: { type: { $in: ['rental', 'delivery', 'deposit'] }, amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const pendingDeliveries = await Order.countDocuments({ status: 'pending_delivery' });
    const pendingReturns = await Order.countDocuments({ status: 'return_requested' });

    return NextResponse.json({
      totalUsers,
      totalBooks,
      totalOrders,
      activeOrders,
      pendingDeliveries,
      pendingReturns,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
