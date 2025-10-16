import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col justify-center gap-6">
      <div className="space-y-4">
        <h1 className="font-bold text-4xl tracking-tight">
          Modern Client-Server data demo
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Pulseboard demonstrates cursor-based pagination, Server Actions, React
          Server Components, and cache invalidation across projects, tickets,
          and members. Explore each workspace to see how forms and detail
          surfaces keep data in sync.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/projects">
            Explore Projects <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/tickets">View Tickets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/members">Meet Members</Link>
        </Button>
      </div>
    </section>
  );
}
