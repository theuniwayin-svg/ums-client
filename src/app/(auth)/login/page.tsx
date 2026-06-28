'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginSchema, type LoginDto } from '@/schemas/auth.schema';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { BrandLogo } from '@/components/brand-logo';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginDto) => {
    setError(null);
    try {
      const response = await api.auth.login(data.email, data.password);
      const { accessToken, user } = response.data.data || response.data;

      setAuth(accessToken, user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/leads');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (status === 429) {
        setError('Too many attempts. Try again in 15 minutes.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md px-4"
    >
      <Card className="shadow-soft border border-border bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-5 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm">
            <BrandLogo variant="full" priority />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Welcome back
          </CardTitle>
          <CardDescription>Sign in to manage leads and follow-ups</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
