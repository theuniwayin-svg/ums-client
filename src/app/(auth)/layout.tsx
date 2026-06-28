export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background px-4 py-8 safe-top safe-bottom"
      style={{ minHeight: '100dvh' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(26,63,92,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(248,164,28,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.7),_transparent_18%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(26,63,92,0.34),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(248,164,28,0.2),_transparent_26%),linear-gradient(180deg,_rgba(2,6,23,0.18),_transparent_18%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 border-b border-border/40 bg-background/50 backdrop-blur-sm" />
      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
