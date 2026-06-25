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
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X, Users, Bell, BarChart3, User, Search } from 'lucide-react';

const navItems = [
  { href: '/leads', label: 'Leads', Icon: Users },
  { href: '/follow-ups', label: 'Follow-ups', Icon: Bell, showBadge: true },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Analytics', Icon: BarChart3 },
  { href: '/admin/staff', label: 'Staff', Icon: User },
  { href: '/admin/audit', label: 'Audit Log', Icon: Search },
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
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className={cn(
          'fixed md:relative z-40 flex flex-col bg-card border-r border-border transition-all duration-300 h-full',
          sidebarOpen ? 'w-64' : 'w-16 max-md:hidden',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">U</span>
          </div>
          {sidebarOpen && (
            <span className="ml-3 font-semibold text-foreground truncate">
              Uniwayin UMS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.Icon className="w-5 h-5 flex-shrink-0" />
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
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
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
                className="text-destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0">
        {/* Topbar */}
        <header className="h-14 md:h-16 bg-card border-b border-border flex items-center px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4 w-full">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted text-foreground md:hidden"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
