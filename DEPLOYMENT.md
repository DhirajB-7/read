# BookNest — Deployment Guide

## 🚀 Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Razorpay account
- Vercel account

---

## 1. Local Development Setup

### Install dependencies
```bash
cd booknest
npm install
```

### Configure environment
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/booknest
JWT_SECRET=your_64_char_random_secret
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
ADMIN_EMAIL=admin@booknest.in
ADMIN_PASSWORD=Admin@123
```

### Seed the database
```bash
node scripts/seed.js
```
This creates:
- Admin account (admin@booknest.in / Admin@123)
- 8 sample books

### Start development server
```bash
npm run dev
```
Visit: http://localhost:3000

---

## 2. MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Whitelist IP: 0.0.0.0/0 (for Vercel deployment)
5. Get connection string: `mongodb+srv://user:pass@cluster.xxx.mongodb.net/booknest`

---

## 3. Razorpay Setup

1. Sign up at https://razorpay.com
2. Go to Settings → API Keys
3. Generate Test API Keys
4. Note your Key ID and Key Secret
5. For production, complete KYC and switch to Live keys

**Test card for payments:**
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits

---

## 4. Deploy to Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel

# Add environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD

# Deploy to production
vercel --prod
```

### Option B: GitHub + Vercel Dashboard
1. Push code to GitHub
2. Go to vercel.com → New Project
3. Import your GitHub repo
4. Add all environment variables in the Vercel dashboard
5. Deploy

---

## 5. Post-Deployment Steps

1. Visit your deployment URL
2. Run the seed script against Atlas:
   ```bash
   MONGODB_URI=your_atlas_uri node scripts/seed.js
   ```
3. Test login with admin@booknest.in / Admin@123
4. Add some books via the Admin Book Manager
5. Test the full user flow: signup → add money → borrow → return

---

## 6. Production Checklist

- [ ] Switch Razorpay to Live keys
- [ ] Set strong JWT_SECRET (64+ chars)
- [ ] Enable MongoDB Atlas IP restrictions
- [ ] Set up custom domain in Vercel
- [ ] Configure Razorpay webhook for payment verification
- [ ] Set up error monitoring (Sentry)
- [ ] Enable Next.js analytics

---

## 7. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Min 32 chars random secret |
| `RAZORPAY_KEY_ID` | ✅ | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | ✅ | From Razorpay dashboard |
| `ADMIN_EMAIL` | ✅ | Admin login email |
| `ADMIN_PASSWORD` | ✅ | Admin login password |

---

## 8. Business Rules Summary

| Rule | Value |
|---|---|
| Security Deposit | ₹500 (always locked) |
| Rental Fee | ₹100 |
| Delivery Fee (1st order) | FREE |
| Delivery Fee (subsequent) | ₹20 |
| Monthly Subscription | ₹100 |
| Min wallet to borrow | ₹600 (₹500 deposit + ₹100 rental) |

**Balance Gate Formula:**  
`walletBalance - charge ≥ 500` (must maintain deposit at all times)

---

## 9. Folder Structure

```
booknest/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── books/page.tsx
│   │   ├── wallet/page.tsx
│   │   └── orders/page.tsx
│   ├── admin/
│   │   ├── page.tsx          # Admin dashboard
│   │   ├── books/page.tsx    # Book CRUD
│   │   ├── orders/page.tsx   # Order management
│   │   └── users/page.tsx    # User management
│   └── api/
│       ├── auth/             # login, signup, logout, me
│       ├── books/            # CRUD
│       ├── orders/           # borrow, list, return-request
│       ├── wallet/           # balance, deposit, withdraw
│       ├── razorpay/         # create-order
│       └── admin/            # stats, orders, users
├── models/
│   ├── User.ts
│   ├── Book.ts
│   ├── Order.ts
│   └── Transaction.ts
├── lib/
│   ├── db.ts                 # MongoDB connection
│   └── auth.ts               # JWT utilities
└── scripts/
    └── seed.js               # Database seeder
```
