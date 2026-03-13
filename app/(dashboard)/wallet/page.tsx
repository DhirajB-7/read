'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Shield, TrendingDown,
  Loader2, Check, AlertCircle, CreditCard, Smartphone, Building2,
  Clock, CheckCircle2, XCircle, Info, ChevronDown, ChevronUp,
  RefreshCw, IndianRupee,
} from 'lucide-react';

const SECURITY_DEPOSIT = 500;
const QUICK_AMOUNTS = [200, 500, 1000, 2000];

/* ── helpers ── */
const TXN_ICON: Record<string, { icon: any; color: string; label: string }> = {
  deposit:            { icon: ArrowDownLeft,  color: 'text-green-600 bg-green-50',  label: 'Money Added'        },
  rental:             { icon: TrendingDown,   color: 'text-red-600 bg-red-50',      label: 'Rental Fee'         },
  delivery:           { icon: TrendingDown,   color: 'text-red-600 bg-red-50',      label: 'Delivery Fee'       },
  refund:             { icon: ArrowDownLeft,  color: 'text-green-600 bg-green-50',  label: 'Refund'             },
  withdrawal:         { icon: ArrowUpRight,   color: 'text-orange-600 bg-orange-50',label: 'Withdrawal'         },
  withdrawal_request: { icon: Clock,          color: 'text-yellow-600 bg-yellow-50',label: 'Withdrawal Pending' },
  subscription:       { icon: Shield,         color: 'text-purple-600 bg-purple-50',label: 'Subscription'       },
};

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock         },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: RefreshCw     },
  completed:  { label: 'Completed',  color: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle2  },
  failed:     { label: 'Failed',     color: 'bg-red-100 text-red-700 border-red-200',          icon: XCircle       },
  rejected:   { label: 'Rejected',   color: 'bg-gray-100 text-gray-700 border-gray-200',       icon: XCircle       },
};

function fmt(n: number) { return n.toLocaleString('en-IN'); }

/* ══════════════════════════════════════════════════════════════════════════ */
export default function WalletPage() {
  const [user, setUser]               = useState<any>(null);
  const [transactions, setTxns]       = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tab, setTab]                 = useState<'add' | 'withdraw' | 'history'>('add');
  const [dataLoading, setDataLoading] = useState(true);
  const [msg, setMsg]                 = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  /* add money */
  const [addAmount, setAddAmount]   = useState('');
  const [addLoading, setAddLoading] = useState(false);

  /* withdraw */
  const [wAmount, setWAmount]             = useState('');
  const [wMethod, setWMethod]             = useState<'upi' | 'bank_transfer'>('upi');
  const [upiId, setUpiId]                 = useState('');
  const [upiName, setUpiName]             = useState('');
  const [accNum, setAccNum]               = useState('');
  const [ifsc, setIfsc]                   = useState('');
  const [holderName, setHolderName]       = useState('');
  const [bankName, setBankName]           = useState('');
  const [wLoading, setWLoading]           = useState(false);
  const [showWithdrawals, setShowWithdrawals] = useState(false);

  const fetchData = async () => {
    try {
      const [uRes, wRes, wrRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/wallet'),
        fetch('/api/wallet/withdraw'),
      ]);
      const [uD, wD, wrD] = await Promise.all([uRes.json(), wRes.json(), wrRes.json()]);
      setUser(uD.user);
      setTxns(wD.transactions || []);
      setWithdrawals(wrD.withdrawals || []);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── ADD MONEY via Razorpay ─────────────────────────────────────────── */
  const handleAddMoney = async () => {
    const amt = Number(addAmount);
    if (!amt || amt < 1) return setMsg({ type: 'error', text: 'Minimum deposit is ₹100' });
    if (amt > 500000) return setMsg({ type: 'error', text: 'Maximum is ₹5,00,000 per transaction' });

    setAddLoading(true);
    setMsg(null);

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'BookNest',
        description: 'Wallet Top-up',
        image: '/logo.png',
        order_id: orderData.orderId,
        // ── Accept ALL payment methods including UPI ──
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
        },
        handler: async (response: any) => {
          // Server-side signature verification
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setMsg({ type: 'success', text: `✅ ₹${fmt(amt)} added to your wallet!` });
            setAddAmount('');
            fetchData();
          } else {
            setMsg({ type: 'error', text: verifyData.error || 'Payment verification failed' });
          }
          setAddLoading(false);
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#f97316', backdrop_color: 'rgba(0,0,0,0.5)' },
        modal: {
          ondismiss: () => setAddLoading(false),
          confirm_close: true,
          animation: true,
        },
        retry: { enabled: true, max_count: 3 },
        timeout: 300,
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setMsg({
          type: 'error',
          text: `Payment failed: ${response.error?.description || 'Unknown error'}`,
        });
        setAddLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Could not initiate payment' });
      setAddLoading(false);
    }
  };

  /* ── WITHDRAW ───────────────────────────────────────────────────────── */
  const handleWithdraw = async () => {
    const amt = Number(wAmount);
    const withdrawable = (user?.walletBalance || 0) - SECURITY_DEPOSIT;

    if (!amt || amt < 100) return setMsg({ type: 'error', text: 'Minimum withdrawal is ₹100' });
    if (amt > withdrawable) return setMsg({ type: 'error', text: `Max withdrawable is ₹${fmt(withdrawable)}` });

    setWLoading(true);
    setMsg(null);

    try {
      const payload: any = { amount: amt, method: wMethod };
      if (wMethod === 'upi') {
        payload.upiId = upiId.trim();
        payload.upiName = upiName.trim();
      } else {
        payload.accountNumber = accNum.trim();
        payload.ifscCode = ifsc.trim().toUpperCase();
        payload.accountHolderName = holderName.trim();
        payload.bankName = bankName.trim();
      }

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({
          type: 'success',
          text: `✅ Withdrawal of ₹${fmt(amt)} requested! Estimated: ${data.withdrawal.estimatedTime}.`,
        });
        setWAmount('');
        setUpiId(''); setUpiName(''); setAccNum(''); setIfsc(''); setHolderName(''); setBankName('');
        fetchData();
        setShowWithdrawals(true);
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } finally {
      setWLoading(false);
    }
  };

  const withdrawable = Math.max(0, (user?.walletBalance || 0) - SECURITY_DEPOSIT);

  /* ── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-500 mt-1">Add money, view balance, and withdraw funds</p>
        </div>

        {/* ── Balance card ── */}
        {dataLoading ? (
          <div className="h-52 bg-gray-200 rounded-3xl animate-pulse" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 rounded-3xl p-8 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-orange-400 blur-3xl" />
              <div className="absolute bottom-4 left-8 w-28 h-28 rounded-full bg-amber-400 blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-orange-400" />
                <span className="text-gray-300 text-sm">Total Balance</span>
              </div>
              <div className="font-display text-5xl font-bold mb-6">
                ₹{fmt(user?.walletBalance || 0)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs text-gray-300">Security Deposit</span>
                  </div>
                  <p className="font-bold text-lg">₹500</p>
                  <p className="text-xs text-gray-400 mt-0.5">Locked · Refundable</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-gray-300">Withdrawable</span>
                  </div>
                  <p className="font-bold text-lg">₹{fmt(withdrawable)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {user?.hasActiveBook ? 'Return book first' : 'Available now'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-gray-300">Pending Withdrawals</span>
                  </div>
                  <p className="font-bold text-lg">
                    {withdrawals.filter(w => ['pending', 'processing'].includes(w.status)).length}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">in progress</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Notification ── */}
        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-xl p-4 flex items-start gap-3 text-sm font-medium border ${
                msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
                : msg.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {msg.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
               : msg.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
               : <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <span>{msg.text}</span>
              <button onClick={() => setMsg(null)} className="ml-auto opacity-50 hover:opacity-100 text-xs">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'add',      label: 'Add Money',  icon: Plus          },
            { key: 'withdraw', label: 'Withdraw',   icon: ArrowUpRight  },
            { key: 'history',  label: 'History',    icon: Clock         },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key as any); setMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════ ADD MONEY TAB ══════════════════════════ */}
        {tab === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
          >
            <div>
              <h2 className="font-display font-bold text-xl text-gray-900">Add Money to Wallet</h2>
              <p className="text-sm text-gray-500 mt-1">Pay via UPI, Card, Net Banking or Wallet</p>
            </div>

            {/* Quick amounts */}
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">Quick Select</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button key={a} onClick={() => setAddAmount(a.toString())}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                      addAmount === a.toString()
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="input-field pl-9"
                  placeholder="Enter amount (min ₹100)"
                  min="100" max="500000"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Min ₹100 · Max ₹5,00,000 per transaction</p>
            </div>

            {/* Payment methods info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: '📱', label: 'UPI',          sub: 'GPay, PhonePe, Paytm' },
                { icon: '💳', label: 'Card',         sub: 'Visa, Mastercard, RuPay' },
                { icon: '🏦', label: 'Net Banking',  sub: 'All major banks' },
                { icon: '👛', label: 'Wallets',      sub: 'Paytm, Mobikwik' },
              ].map((p) => (
                <div key={p.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{p.icon}</div>
                  <div className="text-xs font-semibold text-gray-700">{p.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{p.sub}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddMoney}
              disabled={addLoading || !addAmount}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              {addLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening payment...</>
                : <><CreditCard className="w-4 h-4" /> Pay ₹{addAmount ? fmt(Number(addAmount)) : '0'} Securely</>
              }
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center pt-1">
              <Shield className="w-3.5 h-3.5" />
              256-bit SSL · Secured by Razorpay · PCI-DSS Compliant
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ WITHDRAW TAB ═══════════════════════════ */}
        {tab === 'withdraw' && (
          <motion.div key="withdraw" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Rules card */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5"><Info className="w-4 h-4" /> Withdrawal Rules</p>
              <p>• ₹500 security deposit is always retained in your wallet.</p>
              <p>• You must have no active book rental to withdraw.</p>
              <p>• UPI withdrawals: 30 min – 2 hours. Bank: 1–2 business days.</p>
              <p>• Minimum withdrawal: ₹100. No withdrawal fees.</p>
            </div>

            {user?.hasActiveBook ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-red-700">
                <XCircle className="w-10 h-10 mx-auto mb-3 opacity-60" />
                <p className="font-semibold">Active Rental in Progress</p>
                <p className="text-sm mt-1">Please return your current book before requesting a withdrawal.</p>
              </div>
            ) : withdrawable < 100 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-gray-600">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No Withdrawable Balance</p>
                <p className="text-sm mt-1">Your withdrawable amount is ₹{fmt(withdrawable)}. Add more funds.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl text-gray-900">Withdraw Funds</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Available to withdraw: <span className="font-bold text-orange-600">₹{fmt(withdrawable)}</span>
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount to Withdraw</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={wAmount}
                      onChange={(e) => setWAmount(e.target.value)}
                      className="input-field pl-9"
                      placeholder={`Max ₹${fmt(withdrawable)}`}
                      min="100"
                      max={withdrawable}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[100, 500, Math.min(1000, withdrawable), withdrawable].filter((v, i, arr) => arr.indexOf(v) === i && v >= 100).slice(0, 4).map((v) => (
                      <button key={v} onClick={() => setWAmount(String(v))}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
                      >
                        ₹{fmt(v)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'upi',           icon: Smartphone, label: 'UPI',           sub: '30 min – 2 hrs'   },
                      { key: 'bank_transfer', icon: Building2,  label: 'Bank Transfer', sub: '1–2 business days' },
                    ].map(({ key, icon: Icon, label, sub }) => (
                      <button
                        key={key}
                        onClick={() => setWMethod(key as any)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          wMethod === key
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          wMethod === key ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${wMethod === key ? 'text-orange-700' : 'text-gray-700'}`}>{label}</p>
                          <p className="text-xs text-gray-400">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI fields */}
                <AnimatePresence mode="wait">
                  {wMethod === 'upi' && (
                    <motion.div key="upi" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Money will be sent directly to your UPI ID. Make sure it is linked to an active bank account.</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                            className="input-field pl-10"
                            placeholder="yourname@paytm / 9876543210@ybl"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Accepted: @paytm, @ybl, @okaxis, @oksbi, @ibl, @upi etc.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Holder Name <span className="text-red-500">*</span></label>
                        <input
                          value={upiName}
                          onChange={(e) => setUpiName(e.target.value)}
                          className="input-field"
                          placeholder="Name as registered with UPI"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Bank fields */}
                  {wMethod === 'bank_transfer' && (
                    <motion.div key="bank" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Funds will be transferred to your bank account via NEFT/IMPS. Takes 1–2 business days.</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Holder Name <span className="text-red-500">*</span></label>
                          <input value={holderName} onChange={(e) => setHolderName(e.target.value)} className="input-field" placeholder="Full name as in bank records" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number <span className="text-red-500">*</span></label>
                          <input value={accNum} onChange={(e) => setAccNum(e.target.value.replace(/\D/g, ''))} className="input-field font-mono tracking-wider" placeholder="Enter 8–18 digit account number" maxLength={18} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code <span className="text-red-500">*</span></label>
                          <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} className="input-field font-mono uppercase tracking-wider" placeholder="e.g. SBIN0001234" maxLength={11} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
                          <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-field" placeholder="e.g. SBI, HDFC, ICICI" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Summary */}
                {wAmount && Number(wAmount) >= 100 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-2"
                  >
                    <p className="font-semibold text-gray-800">Withdrawal Summary</p>
                    <div className="flex justify-between text-gray-600">
                      <span>Amount requested</span>
                      <span className="font-medium">₹{fmt(Number(wAmount))}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Processing fee</span>
                      <span className="font-medium text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Method</span>
                      <span className="font-medium">{wMethod === 'upi' ? `UPI → ${upiId || '—'}` : `Bank → ${accNum ? `•••• ${accNum.slice(-4)}` : '—'}`}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                      <span>You will receive</span>
                      <span className="text-orange-600">₹{fmt(Number(wAmount))}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>Wallet balance after</span>
                      <span>₹{fmt((user?.walletBalance || 0) - Number(wAmount))}</span>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={wLoading || !wAmount || Number(wAmount) < 100}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                >
                  {wLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    : <><ArrowUpRight className="w-4 h-4" /> Withdraw ₹{wAmount ? fmt(Number(wAmount)) : '0'}</>
                  }
                </button>
              </div>
            )}

            {/* Withdrawal history inline */}
            {withdrawals.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowWithdrawals(!showWithdrawals)}
                  className="w-full flex items-center justify-between p-5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Recent Withdrawal Requests ({withdrawals.length})
                  </span>
                  {showWithdrawals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {showWithdrawals && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-gray-50">
                        {withdrawals.map((w) => {
                          const cfg = WITHDRAWAL_STATUS[w.status];
                          const Icon = cfg.icon;
                          return (
                            <div key={w._id} className="px-5 py-4 flex items-start gap-4">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-gray-900">₹{fmt(w.amount)}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {w.method === 'upi' ? `UPI → ${w.upiId}` : `Bank → ••••${w.accountNumber?.slice(-4)}`}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(w.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {w.failureReason && (
                                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {w.failureReason}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════ HISTORY TAB ════════════════════════════ */}
        {tab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-display font-bold text-xl text-gray-900">Transaction History</h2>
              <button onClick={fetchData} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {transactions.map((txn) => {
                  const cfg = TXN_ICON[txn.type] || TXN_ICON.deposit;
                  const Icon = cfg.icon;
                  return (
                    <div key={txn._id} className="flex items-center gap-4 px-6 py-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{txn.description}</p>
                          {txn.status === 'pending' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200 flex-shrink-0">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(txn.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.amount > 0 ? '+' : ''}₹{fmt(Math.abs(txn.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
