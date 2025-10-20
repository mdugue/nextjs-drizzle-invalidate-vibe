import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function TicketNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="font-semibold text-2xl">Ticket not found</h2>
      <p className="text-muted-foreground">
        This ticket doesn't exist or may have been deleted.
      </p>
      <Button asChild>
        <Link href="/tickets">Back to tickets</Link>
      </Button>
    </div>
  );
}
