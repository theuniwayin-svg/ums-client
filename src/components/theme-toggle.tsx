'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-full hover:bg-muted"
            title="Toggle theme"
          />
        }
      >
        {theme === 'dark' ? (
          <Moon className="h-5 w-5" />
        ) : theme === 'light' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
