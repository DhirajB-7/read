'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Filter, Check, Loader2, AlertCircle } from 'lucide-react';

const GENRES = ['all', 'Fiction', 'Self-Help', 'Finance', 'History', 'Science', 'Classic', 'Mystery', 'Biography', 'General'];

declare global { interface Window { Razorpay: any; } }

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([fetch('/api/books'), fetch('/api/auth/me')]).then(async ([bRes, uRes]) => {
      const [bData, uData] = await Promise.all([bRes.json(), uRes.json()]);
      setBooks(bData.books || []);
      setUser(uData.user);
      setLoading(false);
    });
  }, []);

  const filtered = books.filter((b) => {
    const matchGenre = genre === 'all' || b.genre === genre;
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  const canBorrow = user && user.walletBalance >= 500 && !user.hasActiveBook;
  const nextCharge = user?.isFirstOrder ? 100 : 120;

  const handleBorrow = async (bookId: string) => {
    if (!canBorrow) return;
    setBorrowingId(bookId);
    setMessage(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to borrow book' });
      } else {
        setMessage({ type: 'success', text: '🎉 Book rented! Expect delivery in 1–2 days.' });
        // Refresh
        const [bRes, uRes] = await Promise.all([fetch('/api/books'), fetch('/api/auth/me')]);
        const [bData, uData] = await Promise.all([bRes.json(), uRes.json()]);
        setBooks(bData.books || []);
        setUser(uData.user);
      }
    } finally {
      setBorrowingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Book Catalog</h1>
          <p className="text-gray-500 mt-1">{books.length} books available</p>
        </div>
        {user && (
          <div className="hidden sm:flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
            <span className="text-sm text-gray-600">Wallet:</span>
            <span className="font-bold text-orange-600">₹{user.walletBalance}</span>
            {user.hasActiveBook && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Book Active</span>}
          </div>
        )}
      </div>

      {/* Charges info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-blue-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Next rental costs: <strong>₹{nextCharge}</strong> (₹100 rental{user && !user?.isFirstOrder ? ' + ₹20 delivery' : ' — first delivery free!'}). Your wallet must stay ≥ ₹500.
      </div>

      {/* Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Search by title or author..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {GENRES.slice(0, 6).map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                genre === g
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No books found</p>
          <p className="text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((book, i) => (
            <motion.div
              key={book._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="book-card group"
            >
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e: any) => { e.target.src = `https://via.placeholder.com/200x300/f97316/ffffff?text=${encodeURIComponent(book.title[0])}`; }}
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-orange-600">₹{book.rentalPrice}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    book.available && book.availableCopies > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {book.available && book.availableCopies > 0 ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <button
                  onClick={() => handleBorrow(book._id)}
                  disabled={!canBorrow || !book.available || borrowingId === book._id}
                  className={`mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    canBorrow && book.available
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {borrowingId === book._id ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Renting...</>
                  ) : !book.available ? (
                    'Unavailable'
                  ) : !user ? (
                    'Login to Rent'
                  ) : user.walletBalance < 500 ? (
                    'Fund Wallet'
                  ) : user.hasActiveBook ? (
                    'Has Active Book'
                  ) : (
                    <><BookOpen className="w-3 h-3" /> Rent for ₹{nextCharge}</>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
