'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, RotateCcw, Loader2, BookOpen, AlertCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  pending_delivery: {
    label: 'Pending Delivery',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    icon: Clock,
    desc: 'Your book is being prepared for delivery.',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Package,
    desc: 'Book delivered! Enjoy reading. Request return when done.',
  },
  return_requested: {
    label: 'Return Requested',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    icon: RotateCcw,
    desc: 'Admin will collect the book shortly.',
  },
  returned: {
    label: 'Returned',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    desc: 'Book returned successfully. You can borrow again!',
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingReturn, setRequestingReturn] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleReturnRequest = async (orderId: string) => {
    setRequestingReturn(orderId);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/return-request`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Return requested! Admin will collect your book soon.' });
        fetchOrders();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } finally {
      setRequestingReturn(null);
    }
  };

  const active = orders.filter((o) => o.status !== 'returned');
  const history = orders.filter((o) => o.status === 'returned');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">{orders.length} total rentals</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-700">No orders yet</p>
          <p className="text-sm text-gray-500 mt-1">Browse our catalog and rent your first book!</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Active</h2>
              <div className="space-y-3">
                {active.map((order) => {
                  const cfg = STATUS_CONFIG[order.status];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="flex gap-4 p-5">
                        <div className="w-16 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                          <img
                            src={order.bookId?.coverImage}
                            alt={order.bookId?.title}
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.src = 'https://via.placeholder.com/64x96/f97316/ffffff?text=📚'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{order.bookId?.title}</h3>
                          <p className="text-sm text-gray-500">{order.bookId?.author}</p>
                          <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">{cfg.desc}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>Rental: ₹{order.rentalCharge}</span>
                            {order.deliveryCharge > 0 && <span>Delivery: ₹{order.deliveryCharge}</span>}
                            <span className="font-semibold text-gray-700">Total: ₹{order.totalCharge}</span>
                          </div>
                        </div>
                      </div>
                      {order.status === 'delivered' && (
                        <div className="px-5 pb-5">
                          <button
                            onClick={() => handleReturnRequest(order._id)}
                            disabled={requestingReturn === order._id}
                            className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                          >
                            {requestingReturn === order._id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
                            ) : (
                              <><RotateCcw className="w-4 h-4" /> Request Return</>
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Past Rentals</h2>
              <div className="space-y-2">
                {history.map((order) => (
                  <div key={order._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-10 h-14 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                      <img
                        src={order.bookId?.coverImage}
                        alt={order.bookId?.title}
                        className="w-full h-full object-cover"
                        onError={(e: any) => { e.target.src = 'https://via.placeholder.com/40x56/f97316/ffffff?text=📚'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{order.bookId?.title}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <div className="badge-status bg-green-100 text-green-700 text-xs">
                        <CheckCircle className="w-3 h-3" /> Returned
                      </div>
                      <p className="text-xs text-gray-500 mt-1">₹{order.totalCharge}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
