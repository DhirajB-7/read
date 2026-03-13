'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet, BookOpen, ShoppingBag, TrendingUp, Plus,
  ChevronRight, AlertCircle, CheckCircle, Clock, Package
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, suffix }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-gray-900">{value}<span className="text-sm font-sans text-gray-500 ml-1">{suffix}</span></div>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </motion.div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending_delivery: { label: 'Pending Delivery', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  delivered: { label: 'Delivered', color: 'bg-blue-100 text-blue-700', icon: Package },
  return_requested: { label: 'Return Requested', color: 'bg-purple-100 text-purple-700', icon: TrendingUp },
  returned: { label: 'Returned', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, ordersRes, walletRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/orders'),
          fetch('/api/wallet'),
        ]);
        const [userData, ordersData, walletData] = await Promise.all([
          userRes.json(),
          ordersRes.json(),
          walletRes.json(),
        ]);
        setUser(userData.user);
        setOrders(ordersData.orders || []);
        setTransactions(walletData.transactions || []);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeOrder = orders.find((o) => ['pending_delivery', 'delivered', 'return_requested'].includes(o.status));
  const walletOk = user?.walletBalance >= 500;
  const canBorrow = walletOk && !user?.hasActiveBook;
  const nextCharge = user?.isFirstOrder ? 100 : 120;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your BookNest overview</p>
      </div>

      {/* Alerts */}
      {!walletOk && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Wallet needs funding</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Add at least ₹{600 - user?.walletBalance} more to unlock book borrowing.
            </p>
          </div>
          <Link href="/wallet" className="btn-primary py-2 px-4 text-sm flex-shrink-0">Add Money</Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wallet Balance" value={`₹${user?.walletBalance || 0}`} icon={Wallet} color="bg-gradient-to-br from-orange-400 to-amber-500" />
        <StatCard label="Total Orders" value={orders.length} icon={ShoppingBag} color="bg-gradient-to-br from-blue-400 to-blue-600" />
        <StatCard label="Books Read" value={orders.filter((o) => o.status === 'returned').length} icon={BookOpen} color="bg-gradient-to-br from-green-400 to-emerald-600" />
        <StatCard label="Next Rental" value={`₹${nextCharge}`} icon={TrendingUp} color="bg-gradient-to-br from-purple-400 to-purple-600" />
      </div>

      {/* Active book or borrow prompt */}
      {activeOrder ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Current Rental</h2>
          <div className="flex gap-4">
            <div className="w-20 h-28 rounded-xl overflow-hidden shadow-md flex-shrink-0">
              <img
                src={activeOrder.bookId?.coverImage}
                alt={activeOrder.bookId?.title}
                className="w-full h-full object-cover"
                onError={(e: any) => { e.target.src = 'https://via.placeholder.com/80x112/f97316/ffffff?text=📚'; }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">{activeOrder.bookId?.title}</h3>
              <p className="text-gray-500 text-sm">{activeOrder.bookId?.author}</p>
              <div className="mt-3">
                {(() => {
                  const cfg = STATUS_CONFIG[activeOrder.status];
                  const Icon = cfg.icon;
                  return (
                    <span className={`badge-status ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Rented on {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {activeOrder.status === 'delivered' && (
                <Link href="/orders" className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 font-medium hover:text-orange-700">
                  Request Return <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border-2 border-dashed transition-all ${
            canBorrow ? 'border-orange-200 bg-orange-50/50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
              <BookOpen className={`w-6 h-6 ${canBorrow ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-1">No active rental</h3>
            <p className="text-gray-500 text-sm mb-4">
              {canBorrow
                ? "You're all set! Browse our collection and rent a book."
                : 'Add money to your wallet to start renting.'}
            </p>
            {canBorrow ? (
              <Link href="/books" className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm">
                <BookOpen className="w-4 h-4" /> Browse Books
              </Link>
            ) : (
              <Link href="/wallet" className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm">
                <Plus className="w-4 h-4" /> Add Money
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <h2 className="font-display font-bold text-xl text-gray-900">Recent Transactions</h2>
            <Link href="/wallet" className="text-orange-500 text-sm font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 5).map((txn) => (
              <div key={txn._id} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                  txn.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {txn.amount > 0 ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{txn.description}</p>
                  <p className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-sm font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
