"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { createTicket } from "@/app/tickets/actions";
import { formatDate } from "@/lib/format";
import type { CursorPaginationResult } from "@/lib/pagination";
import type { Ticket } from "@/lib/schema";
import {
  type TicketFormInput,
  type TicketFormValues,
  ticketFormSchema,
} from "@/lib/zod";

type Option = {
  id: number;
  label: string;
};

type TicketListProps = {
  tickets: Ticket[];
  pageInfo: CursorPaginationResult<Ticket, string>["pageInfo"];
  search?: string;
  sort?: string;
  projectOptions: Option[];
  memberOptions: Option[];
};

function buildQuery(
  base: { search?: string; sort?: string },
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  if (base.search) {
    params.set("search", base.search);
  }
  if (base.sort) {
    params.set("sort", base.sort);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function TicketList({
  tickets,
  pageInfo,
  search,
  sort,
  projectOptions,
  memberOptions,
}: TicketListProps) {
  const router = useRouter();
  const [sortValue, setSortValue] = useState(sort ?? "createdAt");
  const sortSelectId = useId();
  const form = useForm<TicketFormInput, undefined, TicketFormValues>({
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

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: TicketFormValues) => {
    startTransition(async () => {
      try {
        await createTicket(values);
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
          <h1 className="font-semibold text-3xl">Tickets</h1>
          <span className="text-muted-foreground text-sm">
            Navigate to view details
          </span>
        </div>
        <form className="flex flex-wrap items-center gap-3">
          <Input
            className="w-full max-w-sm"
            defaultValue={search ?? ""}
            name="search"
            placeholder="Search tickets"
          />
          <div className="flex items-center gap-2">
            <label
              className="text-muted-foreground text-sm"
              htmlFor={sortSelectId}
            >
              Sort
            </label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              id={sortSelectId}
              name="sort"
              onChange={(event) => setSortValue(event.target.value)}
              value={sortValue}
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
                const project = projectOptions.find(
                  (option) => option.id === ticket.projectId
                );
                return (
                  <tr className="border-t" key={ticket.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={`/tickets/${ticket.id}`}
                      >
                        {ticket.title}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {ticket.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ticket.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{project?.label ?? "—"}</td>
                    <td className="px-4 py-3">{ticket.assignee ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {tickets.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No tickets found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <Button
            asChild
            disabled={!(pageInfo.hasPrevious && pageInfo.prevCursor)}
            variant="outline"
          >
            <Link
              href={buildQuery(baseQuery, {
                cursor: pageInfo.prevCursor,
                direction: pageInfo.prevCursor ? "backward" : undefined,
              })}
            >
              Previous
            </Link>
          </Button>
          <Button
            asChild
            disabled={!(pageInfo.hasNext && pageInfo.nextCursor)}
            variant="outline"
          >
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
          <h2 className="font-semibold text-lg">Create ticket</h2>
        </div>
        <p className="mt-1 text-muted-foreground text-sm">
          Capture a new work item and assign it to a project.
        </p>
        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
                    <Textarea
                      {...field}
                      placeholder="Short problem statement"
                      rows={3}
                    />
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
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : null)
                    }
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            <Button className="w-full" disabled={isPending} type="submit">
              Create ticket
            </Button>
          </form>
        </Form>
      </aside>
    </div>
  );
}
