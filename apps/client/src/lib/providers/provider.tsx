"use client";

import React from "react";
import QueryProvider from "./query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/use-session";
import { AuthMode } from "@/lib/auth/config";

export default function Providers({
  children,
  accessToken,
  authMode,
}: {
  children: React.ReactNode;
  accessToken: string;
  authMode: AuthMode;
}) {
  return (
    <QueryProvider>
      <AuthProvider accessToken={accessToken} mode={authMode}>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
