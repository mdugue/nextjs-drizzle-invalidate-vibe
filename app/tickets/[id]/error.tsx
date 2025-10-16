"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export default function TicketDetailError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-12 text-center">
      <h2 className="font-semibold text-2xl">Unable to load ticket</h2>
      <p className="text-muted-foreground">
        Something went wrong while fetching the ticket details. Try again.
      </p>
      <Button onClick={() => reset()}>Retry</Button>
    </div>
  );
}
