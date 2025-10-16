"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { deleteTicket, updateTicket } from "@/app/tickets/actions";
import type { Ticket } from "@/lib/schema";
import {
  type TicketFormInput,
  type TicketFormValues,
  ticketFormSchema,
} from "@/lib/zod";

interface Option {
  id: number;
  label: string;
}

interface TicketDetailFormProps {
  ticket: Ticket;
  projectOptions: Option[];
  memberOptions: Option[];
}

export function TicketDetailForm({
  ticket,
  projectOptions,
  memberOptions,
}: TicketDetailFormProps) {
  const router = useRouter();
  const form = useForm<TicketFormInput, undefined, TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      slug: ticket.slug,
      title: ticket.title,
      summary: ticket.summary ?? "",
      status: ticket.status,
      projectId: ticket.projectId ?? null,
      assignee: ticket.assignee ?? "",
    },
  });
  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: TicketFormValues) => {
    const formData = new FormData();
    Object.entries({ ...values, projectId: values.projectId ?? "" }).forEach(
      ([key, value]) => {
        formData.append(key, value == null ? "" : String(value));
      },
    );

    startTransition(async () => {
      try {
        await updateTicket(ticket.id, formData);
        toast.success("Ticket updated");
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to update ticket");
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      try {
        await deleteTicket(ticket.id);
        toast.success("Ticket deleted");
        router.push("/tickets");
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to delete ticket");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
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
                <Textarea {...field} rows={4} />
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
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
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
                onValueChange={(value) =>
                  field.onChange(value ? Number(value) : null)
                }
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
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
          >
            Delete
          </Button>
          <Button type="submit" disabled={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
