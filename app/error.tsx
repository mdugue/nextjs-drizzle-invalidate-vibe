"use client";

import { Button } from "@/app/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const supportId = error.digest;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-semibold text-2xl">Something went wrong</h2>
      <p className="max-w-md text-muted-foreground">
        We hit an unexpected error while rendering this page. Try refreshing to
        continue your workflow.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
      <details className="w-full max-w-md text-left text-muted-foreground text-sm">
        <summary className="cursor-pointer font-medium text-foreground">
          Error details
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words">{error.message}</p>
        {supportId ? (
          <p className="mt-2 text-xs uppercase tracking-wide">
            Support ID: <code>{supportId}</code>
          </p>
        ) : null}
      </details>
    </div>
  );
}
