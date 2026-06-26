'use client';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SHORTCUT_GROUPS } from '@/lib/keyboard-shortcuts';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge className="capitalize">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={`${group.title}-${item.key}`} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.context}</p>
                      </div>
                      <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
