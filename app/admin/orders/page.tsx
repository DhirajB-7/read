'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Truck, RotateCcw, CheckCircle, Clock, Package, Loader2, AlertCircle } from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'pending_delivery', label: 'Pending Delivery', icon: Clock },
  { key: 'delivered', label: 'Delivered', icon: Package },
  { key: 'return_requested', label: 'Return Requested', icon: RotateCcw },
  { key: 'returned', label: 'Returned', icon: CheckCircle },
];

const STATUS_STYLE: Record<string, string> = {
  pending_delivery: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  delivered: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  return_requested: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
  returned: 'bg-green-900/30 text-green-400 border-green-500/30',
};

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(searchParams.get('status') || '');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/orders${tab ? `?status=${tab}` : ''}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [tab]);

  const handleAction = async (orderId: string, action: string) => {
    setActionLoading(orderId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: action === 'confirm_delivery' ? '✅ Delivery confirmed!' : '✅ Return confirmed!' });
        fetchOrders();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Order Management</h1>
        <p className="text-gray-400 mt-1">Manage all book deliveries and returns</p>
      </div>

      {message && (
        <div className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-500/30 text-green-400'
            : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Book */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-16 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                    <img
                      src={order.bookId?.coverImage}
                      alt={order.bookId?.title}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = 'https://via.placeholder.com/48x64/f97316/ffffff?text=📚'; }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{order.bookId?.title}</p>
                    <p className="text-sm text-gray-400">{order.bookId?.author}</p>
                    <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[order.status]}`}>
                      {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                </div>

                {/* User */}
                <div className="sm:w-48">
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="text-sm font-medium text-white">{order.userId?.name}</p>
                  <p className="text-xs text-gray-400">{order.userId?.phone}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{order.userId?.address}</p>
                </div>

                {/* Details */}
                <div className="sm:w-32">
                  <p className="text-xs text-gray-500 mb-1">Charges</p>
                  <p className="text-sm text-white font-bold">₹{order.totalCharge}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>

                {/* Actions */}
                <div className="sm:w-40 flex flex-col gap-2">
                  {order.status === 'pending_delivery' && (
                    <button
                      onClick={() => handleAction(order._id, 'confirm_delivery')}
                      disabled={actionLoading === order._id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium hover:bg-green-500/20 transition-colors"
                    >
                      {actionLoading === order._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                      Mark Delivered
                    </button>
                  )}
                  {order.status === 'return_requested' && (
                    <button
                      onClick={() => handleAction(order._id, 'confirm_return')}
                      disabled={actionLoading === order._id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      {actionLoading === order._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Confirm Return
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
