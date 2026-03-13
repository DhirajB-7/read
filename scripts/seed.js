/**
 * Seed script: node scripts/seed.js
 * Creates admin user + sample books
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booknest';

const UserSchema = new mongoose.Schema({
  name: String, email: String, password: String, phone: String,
  address: String, walletBalance: { type: Number, default: 0 },
  isFirstOrder: { type: Boolean, default: true },
  hasActiveBook: { type: Boolean, default: false },
  subscriptionStatus: { type: String, default: 'none' },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: String, author: String, description: String,
  coverImage: String, genre: String, rentalPrice: Number,
  available: Boolean, totalCopies: Number, availableCopies: Number,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

const BOOKS = [
  { title: 'Atomic Habits', author: 'James Clear', description: 'An easy and proven way to build good habits and break bad ones.', coverImage: 'https://covers.openlibrary.org/b/id/10525064-L.jpg', genre: 'Self-Help', rentalPrice: 100, available: true, totalCopies: 5, availableCopies: 5 },
  { title: 'The Alchemist', author: 'Paulo Coelho', description: 'A magical story about following your dreams.', coverImage: 'https://covers.openlibrary.org/b/id/8232463-L.jpg', genre: 'Fiction', rentalPrice: 100, available: true, totalCopies: 3, availableCopies: 3 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', description: 'A brief history of humankind.', coverImage: 'https://covers.openlibrary.org/b/id/10309819-L.jpg', genre: 'History', rentalPrice: 100, available: true, totalCopies: 4, availableCopies: 4 },
  { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', description: 'What the rich teach their kids about money.', coverImage: 'https://covers.openlibrary.org/b/id/8091016-L.jpg', genre: 'Finance', rentalPrice: 100, available: true, totalCopies: 5, availableCopies: 5 },
  { title: 'The Psychology of Money', author: 'Morgan Housel', description: 'Timeless lessons on wealth, greed, and happiness.', coverImage: 'https://covers.openlibrary.org/b/id/10519765-L.jpg', genre: 'Finance', rentalPrice: 100, available: true, totalCopies: 3, availableCopies: 3 },
  { title: '1984', author: 'George Orwell', description: 'A dystopian social science fiction novel.', coverImage: 'https://covers.openlibrary.org/b/id/7222246-L.jpg', genre: 'Classic', rentalPrice: 100, available: true, totalCopies: 4, availableCopies: 4 },
  { title: 'Think and Grow Rich', author: 'Napoleon Hill', description: 'The classic guide to financial success and personal achievement.', coverImage: 'https://covers.openlibrary.org/b/id/8228691-L.jpg', genre: 'Self-Help', rentalPrice: 100, available: true, totalCopies: 3, availableCopies: 3 },
  { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', description: 'A counterintuitive approach to living a good life.', coverImage: 'https://covers.openlibrary.org/b/id/9258289-L.jpg', genre: 'Self-Help', rentalPrice: 100, available: true, totalCopies: 2, availableCopies: 2 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@booknest.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: 'BookNest Admin',
      email: adminEmail,
      password: hashed,
      phone: '9999999999',
      address: 'BookNest HQ, Mumbai',
      walletBalance: 0,
      isAdmin: true,
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin already exists');
  }

  // Seed books
  const bookCount = await Book.countDocuments();
  if (bookCount === 0) {
    await Book.insertMany(BOOKS);
    console.log(`✅ ${BOOKS.length} books seeded`);
  } else {
    console.log(`Books already exist (${bookCount})`);
  }

  console.log('🌱 Seed complete!');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
