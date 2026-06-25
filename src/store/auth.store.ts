import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/schemas/auth.schema';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAccessToken: (token) => {
        // Sync token to cookie so Next.js middleware can read it
        if (typeof document !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=900; SameSite=Lax`;
        }
        set({ accessToken: token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      setAuth: (token, user) => {
        // Write access token to cookie so Next.js middleware can read it
        if (typeof document !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=900; SameSite=Lax`;
        }
        set({ accessToken: token, user, isAuthenticated: true });
      },

      logout: () => {
        // Clear cookie on logout
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; max-age=0';
        }
        set({ accessToken: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ums-auth',
      // Only persist user info — token is in cookie
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
