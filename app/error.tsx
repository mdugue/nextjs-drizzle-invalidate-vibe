"use client";

import { Button } from "@/app/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const description =
    error.message && error.message !== ""
      ? error.message
      : "We hit an unexpected error while rendering this page.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-semibold text-2xl">Something went wrong</h2>
      <p className="max-w-md text-muted-foreground">{description}</p>
      {error.digest ? (
        <p className="text-muted-foreground text-xs">
          Error reference: {error.digest}
        </p>
      ) : null}
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
