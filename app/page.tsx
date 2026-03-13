'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Shield, Truck, RotateCcw, ChevronRight, Check,
  Sparkles, LayoutDashboard, Wallet, LogOut, ChevronDown, Library
} from 'lucide-react';

const FEATURED_BOOKS = [
  { title: 'Atomic Habits', author: 'James Clear', cover: 'https://covers.openlibrary.org/b/id/10525064-L.jpg', genre: 'Self-Help' },
  { title: 'The Alchemist', author: 'Paulo Coelho', cover: 'https://covers.openlibrary.org/b/id/8232463-L.jpg', genre: 'Fiction' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', cover: 'https://covers.openlibrary.org/b/id/10309819-L.jpg', genre: 'History' },
  { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', cover: 'https://covers.openlibrary.org/b/id/8091016-L.jpg', genre: 'Finance' },
  { title: 'The Psychology of Money', author: 'Morgan Housel', cover: 'https://covers.openlibrary.org/b/id/10519765-L.jpg', genre: 'Finance' },
  { title: '1984', author: 'George Orwell', cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg', genre: 'Classic' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Account', desc: 'Sign up in 60 seconds. Add ₹600 to your wallet to get started.', icon: '👤' },
  { step: '02', title: 'Choose a Book', desc: 'Browse our curated library of 500+ titles across all genres.', icon: '📚' },
  { step: '03', title: 'We Deliver', desc: 'Your book arrives at your door within 1–2 business days.', icon: '🚚' },
  { step: '04', title: 'Read & Return', desc: 'Request a return when done. No due dates, no fines.', icon: '🔄' },
];

const STATS = [
  { label: 'Books Available', value: '500+' },
  { label: 'Happy Readers', value: '12K+' },
  { label: 'Cities Served', value: '50+' },
  { label: 'Books Delivered', value: '80K+' },
];

// ─── User Avatar Dropdown ────────────────────────────────────────────────────
function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const initials = user.name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-full pl-1 pr-3 py-1 hover:border-orange-300 hover:shadow-sm transition-all duration-200"
      >
        {/* Avatar */}
        <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-800 hidden sm:block max-w-[100px] truncate">
          {user.name?.split(' ')[0]}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {!user.isAdmin && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Wallet className="w-3 h-3 text-orange-500" />
                  <span className="text-xs font-bold text-orange-600">₹{user.walletBalance ?? 0}</span>
                  <span className="text-xs text-gray-400 ml-0.5">balance</span>
                </div>
              )}
              {user.isAdmin && (
                <span className="inline-block mt-1.5 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  Administrator
                </span>
              )}
            </div>

            {/* Navigation links */}
            <div className="p-1.5">
              {user.isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-orange-500" />
                  Admin Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-orange-500" />
                    My Dashboard
                  </Link>
                  <Link
                    href="/books"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <Library className="w-4 h-4 text-orange-500" />
                    Browse Books
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-orange-500" />
                    My Wallet
                  </Link>
                </>
              )}
            </div>

            {/* Logout */}
            <div className="p-1.5 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900">BookNest</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="nav-link">How It Works</Link>
            <Link href="#pricing" className="nav-link">Pricing</Link>
            <Link href="/books" className="nav-link">Browse Books</Link>
          </div>

          {/* Auth section */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-28 h-8 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Link href="/login" className="btn-secondary py-2 text-sm hidden sm:inline-flex">Log In</Link>
                <Link href="/signup" className="btn-primary py-2 text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-gradient-to-br from-orange-100 to-amber-50 rounded-full opacity-60 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-100 to-orange-50 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              India's #1 Book Rental Service
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-6xl md:text-7xl font-bold text-gray-900 leading-[1.05] mb-6"
            >
              {user ? `Welcome back,` : 'Read More.'}
              <br />
              <span className="gradient-text">
                {user ? `${user.name?.split(' ')[0]}!` : 'Spend Less.'}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-500 mb-8 max-w-xl leading-relaxed"
            >
              {user
                ? `You have ₹${user.walletBalance ?? 0} in your wallet. Browse 500+ books and start reading today.`
                : 'Premium books delivered to your door. Rent for just ₹100 per book — no due dates, no fines. Just great reading.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link
                href={user ? (user.isAdmin ? '/admin' : '/books') : '/signup'}
                className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2"
              >
                {user ? 'Browse Books' : 'Start Reading Today'}
                <ChevronRight className="w-4 h-4" />
              </Link>
              {user && !user.isAdmin && (
                <Link href="/dashboard" className="btn-secondary text-base px-8 py-4">
                  My Dashboard
                </Link>
              )}
              {!user && (
                <Link href="/books" className="btn-secondary text-base px-8 py-4">
                  Browse Collection
                </Link>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-6 text-sm text-gray-500"
            >
              {['First delivery free', 'No due dates', '500+ books', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-green-600" />
                  </div>
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Floating book covers */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block absolute top-0 right-0 w-[460px]"
          >
            <div className="relative h-[520px]">
              {FEATURED_BOOKS.slice(0, 4).map((book, i) => {
                const positions = [
                  { top: '0%', left: '30%', rotate: 8, z: 1 },
                  { top: '8%', left: '2%', rotate: -6, z: 2 },
                  { top: '42%', left: '45%', rotate: 5, z: 1 },
                  { top: '38%', left: '12%', rotate: -4, z: 2 },
                ];
                const pos = positions[i];
                return (
                  <motion.div
                    key={book.title}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    className="absolute shadow-2xl rounded-xl overflow-hidden"
                    style={{ top: pos.top, left: pos.left, transform: `rotate(${pos.rotate}deg)`, zIndex: pos.z, width: 130, height: 190 }}
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = `https://via.placeholder.com/130x190/f97316/ffffff?text=${encodeURIComponent(book.title[0])}`; }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-12 px-6 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Books ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-orange-500 font-medium text-sm mb-2 uppercase tracking-wider">Our Collection</p>
              <h2 className="font-display text-4xl font-bold text-gray-900">Trending Reads</h2>
            </div>
            <Link href="/books" className="text-orange-500 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FEATURED_BOOKS.map((book, i) => (
              <motion.div
                key={book.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = `https://via.placeholder.com/200x300/f97316/ffffff?text=${encodeURIComponent(book.title[0])}`; }}
                  />
                </div>
                <div className="mt-3 px-1">
                  <p className="font-medium text-gray-900 text-sm leading-tight line-clamp-1">{book.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{book.author}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-orange-500 font-medium">₹100/rental</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{book.genre}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-medium text-sm mb-2 uppercase tracking-wider">Simple Process</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">How BookNest Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-orange-200 via-amber-300 to-orange-200" />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl mb-5 relative z-10 border border-gray-100">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-orange-500 mb-2 tracking-widest">{step.step}</div>
                <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-medium text-sm mb-2 uppercase tracking-wider">Simple Pricing</p>
            <h2 className="font-display text-4xl font-bold text-gray-900">No Surprises. Ever.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Pay Per Book', price: '₹100', period: 'per rental', features: ['1 book at a time', 'First delivery free', '₹20 delivery from 2nd order', '₹500 refundable deposit'], highlight: false },
              { name: 'Subscription', price: '₹100', period: 'per month', features: ['Unlimited rentals', '1 book at a time', 'Free delivery always', 'Priority support'], highlight: true },
              { name: 'Security Deposit', price: '₹500', period: 'one-time', features: ['Fully refundable', 'Always in your wallet', 'Withdraw anytime', 'Zero risk'], highlight: false },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-8 ${plan.highlight ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-2xl shadow-orange-500/30 scale-105' : 'bg-white border border-gray-100 shadow-lg'}`}
              >
                <p className={`text-sm font-medium mb-4 ${plan.highlight ? 'text-orange-100' : 'text-orange-500'}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-orange-100' : 'text-gray-500'}`}>{plan.period}</p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-white/20' : 'bg-orange-50'}`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? 'text-white' : 'text-orange-500'}`} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? (user.isAdmin ? '/admin' : '/dashboard') : '/signup'}
                  className={`mt-8 block text-center py-3 rounded-xl font-medium text-sm transition-all ${plan.highlight ? 'bg-white text-orange-600 hover:bg-orange-50' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: <Shield className="w-6 h-6" />, title: 'Secure Wallet', desc: "Your ₹500 deposit is always safe. Withdraw anytime when you're done." },
              { icon: <Truck className="w-6 h-6" />, title: 'Fast Delivery', desc: 'Books delivered within 1–2 days. First order is always free.' },
              { icon: <RotateCcw className="w-6 h-6" />, title: 'Easy Returns', desc: 'One-tap return requests. We come to pick it up from you.' },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-12 text-white shadow-2xl shadow-orange-500/30"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              {user ? `Keep reading, ${user.name?.split(' ')[0]}!` : 'Start Your Reading Journey'}
            </h2>
            <p className="text-orange-100 mb-8 text-lg">
              {user ? 'Your next great book is waiting in the catalog.' : 'Join 12,000+ readers who discover new worlds every month.'}
            </p>
            <Link
              href={user ? '/books' : '/signup'}
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors"
            >
              {user ? 'Browse Books' : 'Create Free Account'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">BookNest</span>
          </div>
          <p className="text-gray-400 text-sm">© 2024 BookNest. Made with ❤️ in India.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-gray-800 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-gray-800 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-gray-800 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
