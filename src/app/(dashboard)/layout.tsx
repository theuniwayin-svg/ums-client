'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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
import { BrandLogo } from '@/components/brand-logo';
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

type SidebarState = 'auto' | 'open' | 'closed';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarState, setSidebarState] = useState<SidebarState>('auto');
  const { data: pendingFollowUps } = usePendingFollowUps();
  const pendingCount = Array.isArray(pendingFollowUps)
    ? pendingFollowUps.length
    : 0;

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const sidebarShellClass =
    sidebarState === 'auto'
      ? 'w-0 overflow-hidden md:w-64 md:overflow-visible'
      : sidebarState === 'open'
        ? 'w-64'
        : 'w-0 overflow-hidden md:w-16 md:overflow-visible';
  const sidebarContentClass =
    sidebarState === 'auto'
      ? 'hidden md:block'
      : sidebarState === 'open'
        ? 'block'
        : 'hidden';
  const sidebarBadgeClass =
    sidebarState === 'auto'
      ? 'hidden md:inline-flex'
      : sidebarState === 'open'
        ? 'inline-flex'
        : 'hidden';

  const toggleSidebar = () => {
    setSidebarState((current) => {
      if (current === 'auto') {
        return window.innerWidth < 768 ? 'open' : 'closed';
      }
      return current === 'open' ? 'closed' : 'open';
    });
  };

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
          sidebarShellClass,
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <BrandLogo
            variant={sidebarState === 'closed' ? 'mark' : 'full'}
            className={cn('min-w-0', sidebarContentClass)}
            markClassName={sidebarState === 'closed' ? 'h-9 w-9' : undefined}
            priority
          />
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
              <span className={cn('flex-1', sidebarContentClass)}>
                {item.label}
              </span>
              {item.showBadge && pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn('ml-auto text-xs', sidebarBadgeClass)}
                >
                  {pendingCount}
                </Badge>
              )}
            </Link>
          ))}

          {isAdmin && (
            <div className={sidebarState === 'closed' ? 'pt-2' : 'pt-4'}>
              <p
                className={cn(
                  'px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2',
                  sidebarContentClass,
                )}
              >
                Admin
              </p>
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
                  <span className={sidebarContentClass}>{item.label}</span>
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
              <div
                className={cn(
                  'flex-1 text-left min-w-0',
                  sidebarContentClass,
                )}
              >
                <p className="font-medium text-foreground truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {user?.role}
                </p>
              </div>
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
        <header className="h-14 md:h-16 bg-card border-b border-border flex items-center px-3 md:px-6 flex-shrink-0 safe-top">
          <div className="flex items-center gap-2 md:gap-4 w-full">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-muted text-foreground flex-shrink-0"
              title="Toggle sidebar"
            >
              {sidebarState === 'auto' ? (
                <>
                  <X className="hidden h-5 w-5 md:block" />
                  <Menu className="h-5 w-5 md:hidden" />
                </>
              ) : sidebarState === 'open' ? (
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
        <main className="flex-1 overflow-auto bg-background safe-bottom">
          <div className="p-4 md:p-6 max-w-7xl mx-auto pb-8">
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
      {sidebarState === 'open' && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarState('closed')}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
