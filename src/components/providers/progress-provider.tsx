'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color="#4f46e5" // indigo-600 to match your primary theme
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
