import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col w-[480px] bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-orange-400 blur-3xl" />
          <div className="absolute bottom-20 right-5 w-48 h-48 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">BookNest</span>
        </Link>
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Your next great<br />read is waiting.
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Join thousands of book lovers who rent premium books for just ₹100 per rental.
          </p>
          <div className="mt-10 space-y-4">
            {['First delivery always free', '500+ curated titles', '₹500 refundable deposit', 'No due dates'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-gray-300">
                <div className="w-5 h-5 rounded-full bg-orange-500/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 text-sm relative z-10">© 2024 BookNest</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
