"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberFormSchema, type MemberFormValues } from "@/lib/zod";
import { memberStatus, type Member } from "@/lib/schema";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { createMember, deleteMember, updateMember } from "@/app/members/actions";

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onDeleted?: (id: number) => void;
}

export function MemberDialog({ open, onOpenChange, member, onDeleted }: MemberDialogProps) {
  const router = useRouter();
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      slug: "",
      name: "",
      email: "",
      status: "invited",
      bio: "",
      role: "",
    },
    values: member
      ? {
          slug: member.slug,
          name: member.name,
          email: member.email,
          status: member.status,
          bio: member.bio ?? "",
          role: member.role ?? "",
        }
      : undefined,
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({
        slug: "",
        name: "",
        email: "",
        status: "invited",
        bio: "",
        role: "",
      });
    }
  }, [open, form]);

  const [isPending, startTransition] = React.useTransition();

  const onSubmit = (values: MemberFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });

    startTransition(async () => {
      try {
        if (member) {
          await updateMember(member.id, formData);
          toast.success("Member updated");
        } else {
          await createMember(formData);
          toast.success("Member added");
        }
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to save member");
      }
    });
  };

  const onDelete = () => {
    if (!member) return;
    startTransition(async () => {
      try {
        await deleteMember(member.id);
        toast.success("Member removed");
        onDeleted?.(member.id);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to delete member");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? member.name : "Invite member"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Edit profile details and update their status."
              : "Fill in the details to invite a new teammate."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                    <Input {...field} placeholder="member-slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                      {memberStatus.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Product Designer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Quick introduction" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex items-center justify-between gap-2 sm:flex-row">
              {member ? (
                <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
                  Remove
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={isPending}>
                {member ? "Save changes" : "Invite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
