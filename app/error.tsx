"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-muted-foreground">
        We hit an unexpected error while rendering this page. Try refreshing to continue your workflow.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
