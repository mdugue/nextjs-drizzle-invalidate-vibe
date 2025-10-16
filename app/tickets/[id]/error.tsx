"use client";

import { Button } from "@/app/components/ui/button";

export default function TicketDetailError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-12 text-center">
      <h2 className="font-semibold text-2xl">Unable to load ticket</h2>
      <p className="text-muted-foreground">
        Something went wrong while fetching the ticket details. Try again.
      </p>
      <Button onClick={() => reset()}>Retry</Button>
      <details className="w-full max-w-md text-left text-muted-foreground text-sm">
        <summary className="cursor-pointer font-medium text-foreground">
          Error details
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words">{error.message}</p>
      </details>
    </div>
  );
}
