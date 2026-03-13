'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, ShoppingBag, TrendingUp, Truck, RotateCcw, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then((d) => {
      setStats(d);
      setLoading(false);
    });
  }, []);

  const cards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600', change: '+12%' },
        { label: 'Total Books', value: stats.totalBooks, icon: BookOpen, color: 'from-green-500 to-emerald-600', change: '+3' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'from-purple-500 to-purple-600', change: '+28' },
        { label: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'from-orange-500 to-amber-500', change: '+18%' },
        { label: 'Pending Deliveries', value: stats.pendingDeliveries, icon: Truck, color: 'from-yellow-500 to-yellow-600', urgent: stats.pendingDeliveries > 0 },
        { label: 'Pending Returns', value: stats.pendingReturns, icon: RotateCcw, color: 'from-red-500 to-red-600', urgent: stats.pendingReturns > 0 },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">BookNest platform overview</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">Live</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-gray-900 border rounded-2xl p-6 relative overflow-hidden ${
                  card.urgent ? 'border-orange-500/40' : 'border-gray-800'
                }`}
              >
                {card.urgent && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                )}
                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-display text-2xl font-bold text-white">{card.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  {card.change && <span className="text-xs text-green-400">{card.change}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.a
          href="/admin/orders?status=pending_delivery"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-yellow-500/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Manage Deliveries</p>
              <p className="text-sm text-gray-400">Confirm pending book deliveries</p>
            </div>
          </div>
        </motion.a>

        <motion.a
          href="/admin/orders?status=return_requested"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-red-500/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-red-400 transition-colors">Process Returns</p>
              <p className="text-sm text-gray-400">Confirm book returns from users</p>
            </div>
          </div>
        </motion.a>
      </div>
    </div>
  );
}
