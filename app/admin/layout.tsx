'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, LayoutDashboard, Library, Users, ShoppingBag, LogOut, Menu, X, Shield, ArrowUpRight } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin',             label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/orders',      label: 'Orders',      icon: ShoppingBag     },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpRight    },
  { href: '/admin/books',       label: 'Book Manager',icon: Library         },
  { href: '/admin/users',       label: 'Users',       icon: Users           },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user?.isAdmin) router.push('/login');
      else setAdmin(d.user);
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-sm">BookNest</span>
            <div className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">Admin Panel</span>
            </div>
          </div>
        </Link>
      </div>

      {admin && (
        <div className="p-4 mx-3 mt-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {admin.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{admin.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      )}

      <nav className="p-3 space-y-0.5 flex-1 mt-2">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-800 fixed h-full z-20">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 flex flex-col"
          >
            <SidebarContent />
          </motion.aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="lg:hidden bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-white">Admin</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-6 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
