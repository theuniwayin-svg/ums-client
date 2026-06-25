'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { usePendingFollowUps } from '@/hooks/use-leads';

const navItems = [
  { href: '/leads', label: 'Leads', icon: '👥' },
  { href: '/follow-ups', label: 'Follow-ups', icon: '🔔', showBadge: true },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Analytics', icon: '📊' },
  { href: '/admin/staff', label: 'Staff', icon: '👤' },
  { href: '/admin/audit', label: 'Audit Log', icon: '🔍' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: pendingFollowUps } = usePendingFollowUps();
  const pendingCount = Array.isArray(pendingFollowUps)
    ? pendingFollowUps.length
    : 0;

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    logout();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          {sidebarOpen && (
            <span className="ml-3 font-semibold text-gray-900 truncate">
              Uniwayin UMS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="flex-1">{item.label}</span>
              )}
              {sidebarOpen && item.showBadge && pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-auto text-xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </Link>
          ))}

          {isAdmin && (
            <div className={sidebarOpen ? 'pt-4' : 'pt-2'}>
              {sidebarOpen && (
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Admin
                </p>
              )}
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-200 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-700 font-semibold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {user?.role}
                  </p>
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 mr-4"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
