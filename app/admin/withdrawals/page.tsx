'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, RefreshCw, Loader2,
  Smartphone, Building2, IndianRupee, AlertCircle, Check,
  ChevronDown
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'pending',    label: 'Pending',    color: 'text-yellow-400' },
  { key: 'processing', label: 'Processing', color: 'text-blue-400'   },
  { key: 'completed',  label: 'Completed',  color: 'text-green-400'  },
  { key: 'rejected',   label: 'Rejected',   color: 'text-red-400'    },
  { key: 'all',        label: 'All',        color: 'text-gray-400'   },
];

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  completed:  'bg-green-900/30 text-green-400 border-green-500/30',
  failed:     'bg-red-900/30 text-red-400 border-red-500/30',
  rejected:   'bg-gray-800 text-gray-400 border-gray-600/30',
};

function fmt(n: number) { return n.toLocaleString('en-IN'); }

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals?status=${tab}`);
    const data = await res.json();
    setWithdrawals(data.withdrawals || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const doAction = async (withdrawalId: string, action: string, reason?: string) => {
    setActionId(withdrawalId);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, action, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `✅ Withdrawal ${action.replace('mark_', '').replace('_', ' ')}` });
        setRejectId(null);
        setRejectReason('');
        fetchData();
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Withdrawal Requests</h1>
          <p className="text-gray-400 mt-1">Process user UPI and bank withdrawal requests</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* How payouts work */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 space-y-1">
        <p className="font-semibold text-blue-200">📋 Admin Payout Process</p>
        <p>1. <strong>Pending</strong> → Click "Mark Processing" once you initiate the transfer manually or via RazorpayX.</p>
        <p>2. <strong>Processing</strong> → Click "Mark Completed" after the transfer confirms. Or "Reject" if it fails.</p>
        <p>3. On <strong>Rejection</strong>, the amount is automatically refunded back to the user's wallet.</p>
      </div>

      {msg && (
        <div className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium border ${
          msg.type === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === key ? 'bg-orange-500 text-white' : `bg-gray-800 ${color} hover:bg-gray-700`
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
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No {tab} withdrawals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w, i) => (
            <motion.div
              key={w._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Amount + method */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    w.method === 'upi' ? 'bg-purple-900/30' : 'bg-blue-900/30'
                  }`}>
                    {w.method === 'upi'
                      ? <Smartphone className="w-5 h-5 text-purple-400" />
                      : <Building2 className="w-5 h-5 text-blue-400" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-xl text-white">₹{fmt(w.amount)}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[w.status]}`}>
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                    </div>
                    {w.method === 'upi' ? (
                      <p className="text-sm text-gray-400 mt-0.5">
                        UPI → <span className="text-purple-300 font-medium">{w.upiId}</span>
                        <span className="text-gray-500 ml-1">({w.upiName})</span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-0.5">
                        Bank → <span className="text-blue-300 font-medium">
                          {w.accountHolderName} · ••••{w.accountNumber?.slice(-4)}
                        </span>
                        <span className="text-gray-500 ml-1">IFSC: {w.ifscCode}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* User info */}
                <div className="sm:w-44">
                  <p className="text-sm font-medium text-white">{w.userId?.name}</p>
                  <p className="text-xs text-gray-400">{w.userId?.email}</p>
                  <p className="text-xs text-gray-500">{w.userId?.phone}</p>
                </div>

                {/* Date */}
                <div className="sm:w-32 text-xs text-gray-500">
                  <p>Requested</p>
                  <p className="text-gray-300">
                    {new Date(w.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {w.processedAt && (
                    <>
                      <p className="mt-1">Processed</p>
                      <p className="text-gray-300">
                        {new Date(w.processedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                {(w.status === 'pending' || w.status === 'processing') && (
                  <div className="flex flex-col gap-2 sm:w-44">
                    {w.status === 'pending' && (
                      <button
                        onClick={() => doAction(w._id, 'mark_processing')}
                        disabled={actionId === w._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors"
                      >
                        {actionId === w._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Mark Processing
                      </button>
                    )}
                    {w.status === 'processing' && (
                      <button
                        onClick={() => doAction(w._id, 'mark_completed')}
                        disabled={actionId === w._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium hover:bg-green-500/20 transition-colors"
                      >
                        {actionId === w._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Mark Completed
                      </button>
                    )}
                    {/* Reject */}
                    {rejectId === w._id ? (
                      <div className="space-y-2">
                        <input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                          placeholder="Rejection reason..."
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => doAction(w._id, 'reject', rejectReason || 'Rejected by admin')}
                            disabled={actionId === w._id}
                            className="flex-1 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30"
                          >
                            {actionId === w._id ? '...' : 'Confirm Reject'}
                          </button>
                          <button
                            onClick={() => { setRejectId(null); setRejectReason(''); }}
                            className="flex-1 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectId(w._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject & Refund
                      </button>
                    )}
                  </div>
                )}

                {/* Failure reason */}
                {w.failureReason && (
                  <div className="sm:w-44">
                    <p className="text-xs text-red-400 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {w.failureReason}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
