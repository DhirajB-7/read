'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, BookOpen, Loader2, X, Check, AlertCircle, ImageIcon } from 'lucide-react';

const GENRES = ['Fiction', 'Self-Help', 'Finance', 'History', 'Science', 'Classic', 'Mystery', 'Biography', 'General'];

const EMPTY_FORM = {
  title: '',
  author: '',
  description: '',
  coverImage: '',
  genre: 'General',
  rentalPrice: 100,
  available: true,
  totalCopies: 1,
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchBooks = async () => {
    const res = await fetch('/api/books');
    const data = await res.json();
    setBooks(data.books || []);
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.author || !form.description || !form.coverImage) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = editId ? `/api/books/${editId}` : '/api/books';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: editId ? '✅ Book updated!' : '✅ Book added!' });
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditId(null);
        fetchBooks();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (book: any) => {
    setForm({
      title: book.title,
      author: book.author,
      description: book.description,
      coverImage: book.coverImage,
      genre: book.genre,
      rentalPrice: book.rentalPrice,
      available: book.available,
      totalCopies: book.totalCopies,
    });
    setEditId(book._id);
    setShowForm(true);
    setMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    setDeletingId(id);
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    fetchBooks();
    setDeletingId(null);
  };

  const field = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Book Manager</h1>
          <p className="text-gray-400 mt-1">{books.length} books in catalog</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditId(null); setMessage(null); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-500/30 text-green-400'
            : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="font-display font-bold text-xl text-white">{editId ? 'Edit Book' : 'Add New Book'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
                    <input
                      value={form.title}
                      onChange={(e) => field('title', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      placeholder="Book title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Author *</label>
                    <input
                      value={form.author}
                      onChange={(e) => field('author', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      placeholder="Author name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => field('description', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 h-24 resize-none"
                    placeholder="Book description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Cover Image URL *</label>
                  <input
                    value={form.coverImage}
                    onChange={(e) => field('coverImage', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    placeholder="https://covers.openlibrary.org/b/id/XXXXX-L.jpg"
                  />
                  {form.coverImage && (
                    <div className="mt-3 flex gap-3 items-center">
                      <div className="w-16 h-24 rounded-lg overflow-hidden border border-gray-700">
                        <img
                          src={form.coverImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e: any) => { e.target.src = 'https://via.placeholder.com/64x96/374151/9ca3af?text=No+Image'; }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Cover preview
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Genre</label>
                    <select
                      value={form.genre}
                      onChange={(e) => field('genre', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    >
                      {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Rental Price (₹)</label>
                    <input
                      type="number"
                      value={form.rentalPrice}
                      onChange={(e) => field('rentalPrice', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Total Copies</label>
                    <input
                      type="number"
                      value={form.totalCopies}
                      onChange={(e) => field('totalCopies', Number(e.target.value))}
                      min="1"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.available}
                      onChange={(e) => field('available', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-700 peer-checked:bg-orange-500 rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                  <span className="text-sm text-gray-300">Available for rental</span>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-800">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editId ? '✓ Update Book' : '+ Add Book'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Books grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No books yet. Add your first book!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book, i) => (
            <motion.div
              key={book._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group"
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.target.src = `https://via.placeholder.com/200x300/374151/9ca3af?text=${encodeURIComponent(book.title[0])}`; }}
                />
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${book.available ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleEdit(book)}
                    className="w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(book._id)}
                    disabled={deletingId === book._id}
                    className="w-9 h-9 bg-red-500/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                  >
                    {deletingId === book._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-white text-sm line-clamp-1">{book.title}</p>
                <p className="text-xs text-gray-400">{book.author}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-orange-400">₹{book.rentalPrice}</span>
                  <span className="text-xs text-gray-500">{book.availableCopies}/{book.totalCopies}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
