"use client";

import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="h-[65px] border-b bg-white" />
        <div className="flex-1" />
      </div>
    );
  }

  return <>{children}</>;
}
