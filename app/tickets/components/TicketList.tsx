"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Ticket } from "@/lib/schema";
import type { CursorPaginationResult } from "@/lib/pagination";
import { ticketFormSchema, type TicketFormValues } from "@/lib/zod";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { createTicket } from "@/app/tickets/actions";
import { formatDate } from "@/lib/format";

interface Option {
  id: number;
  label: string;
}

interface TicketListProps {
  tickets: Ticket[];
  pageInfo: CursorPaginationResult<Ticket, string>["pageInfo"];
  search?: string;
  sort?: string;
  projectOptions: Option[];
  memberOptions: Option[];
}

function buildQuery(base: { search?: string; sort?: string }, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (base.search) params.set("search", base.search);
  if (base.sort) params.set("sort", base.sort);
  Object.entries(overrides).forEach(([key, value]) => {
    if (!value) params.delete(key);
    else params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function TicketList({ tickets, pageInfo, search, sort, projectOptions, memberOptions }: TicketListProps) {
  const router = useRouter();
  const [sortValue, setSortValue] = React.useState(sort ?? "createdAt");
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      slug: "",
      title: "",
      summary: "",
      status: "todo",
      projectId: null,
      assignee: "",
    },
  });

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: TicketFormValues) => {
    const formData = new FormData();
    Object.entries({ ...values, projectId: values.projectId ?? "" }).forEach(([key, value]) => {
      formData.append(key, value === null ? "" : String(value));
    });

    startTransition(async () => {
      try {
        await createTicket(formData);
        toast.success("Ticket created");
        form.reset({
          slug: "",
          title: "",
          summary: "",
          status: "todo",
          projectId: null,
          assignee: "",
        });
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to create ticket");
      }
    });
  };

  const baseQuery = { search, sort: sortValue };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">Tickets</h1>
          <span className="text-sm text-muted-foreground">Navigate to view details</span>
        </div>
        <form className="flex flex-wrap items-center gap-3" role="search">
          <Input name="search" placeholder="Search tickets" defaultValue={search ?? ""} className="w-full max-w-sm" />
          <div className="flex items-center gap-2">
            <label htmlFor="ticket-sort" className="text-sm text-muted-foreground">
              Sort
            </label>
            <select
              id="ticket-sort"
              name="sort"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value)}
            >
              <option value="createdAt">Newest</option>
              <option value="title">Title</option>
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Project</th>
                <th className="px-4 py-2 text-left font-medium">Assignee</th>
                <th className="px-4 py-2 text-right font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const project = projectOptions.find((option) => option.id === ticket.projectId);
                return (
                  <tr key={ticket.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">
                        {ticket.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">{ticket.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ticket.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{project?.label ?? "—"}</td>
                    <td className="px-4 py-3">{ticket.assignee ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(ticket.createdAt)}</td>
                  </tr>
                );
              })}
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No tickets found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={!pageInfo.hasPrevious || !pageInfo.prevCursor} asChild>
            <Link
              href={buildQuery(baseQuery, {
                cursor: pageInfo.prevCursor,
                direction: pageInfo.prevCursor ? "backward" : undefined,
              })}
            >
              Previous
            </Link>
          </Button>
          <Button variant="outline" disabled={!pageInfo.hasNext || !pageInfo.nextCursor} asChild>
            <Link
              href={buildQuery(baseQuery, {
                cursor: pageInfo.nextCursor,
                direction: undefined,
              })}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
      <aside className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <h2 className="text-lg font-semibold">Create ticket</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Capture a new work item and assign it to a project.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Implement feature" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ticket-slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Short problem statement" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {projectOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {memberOptions.map((option) => (
                        <SelectItem key={option.id} value={option.label}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              Create ticket
            </Button>
          </form>
        </Form>
      </aside>
    </div>
  );
}
