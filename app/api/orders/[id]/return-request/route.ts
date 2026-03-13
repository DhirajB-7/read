import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const order = await Order.findById(params.id);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.userId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Book not yet delivered' }, { status: 400 });
    }

    order.status = 'return_requested';
    order.returnRequestedAt = new Date();
    await order.save();

    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
