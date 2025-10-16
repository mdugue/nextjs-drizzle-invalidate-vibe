"use client";

import { Toaster } from "sonner";
import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="bottom-center" />
    </>
  );
}
