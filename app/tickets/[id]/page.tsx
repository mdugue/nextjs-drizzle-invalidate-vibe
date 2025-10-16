import { notFound } from "next/navigation";
import { TicketDetailForm } from "@/app/tickets/components/TicketDetailForm";
import { formatDate } from "@/lib/format";
import {
  getMemberOptions,
  getProjectOptions,
  getTicketDetail,
} from "@/lib/queries";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id } = await params;
  const ticketId = Number(id);
  if (Number.isNaN(ticketId)) {
    notFound();
  }

  const ticket = await getTicketDetail(ticketId);
  if (!ticket) {
    notFound();
  }

  const projects = await getProjectOptions();
  const members = await getMemberOptions();

  const projectLabel =
    projects.find((project) => project.id === ticket.projectId)?.title ??
    "Unassigned";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Ticket #{ticket.slug}</p>
        <h1 className="text-4xl font-semibold">{ticket.title}</h1>
        <p className="text-sm text-muted-foreground">
          Created {formatDate(ticket.createdAt)} • Updated{" "}
          {formatDate(ticket.updatedAt)} • Project {projectLabel}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_1fr]">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Summary</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {ticket.summary ?? "No summary provided."}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Metadata</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Status</dt>
              <dd>{ticket.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Assignee</dt>
              <dd>{ticket.assignee ?? "Unassigned"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Project</dt>
              <dd>{projectLabel}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Edit ticket</h2>
        <p className="text-sm text-muted-foreground">
          Adjust status, assignee, and metadata.
        </p>
        <div className="mt-4">
          <TicketDetailForm
            ticket={ticket}
            projectOptions={projects.map((project) => ({
              id: project.id,
              label: project.title,
            }))}
            memberOptions={members.map((member) => ({
              id: member.id,
              label: member.name,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
