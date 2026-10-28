import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-dvh bg-app-bg text-text-main flex flex-col justify-center overflow-x-hidden w-full">
      {children}
    </div>
  );
}
