"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import {
  createMember,
  deleteMember,
  updateMember,
} from "@/app/members/actions";
import { type Member, memberStatus } from "@/lib/schema";
import { type MemberFormValues, memberFormSchema } from "@/lib/zod";

type MemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onDeleted?: (id: number) => void;
};

export function MemberDialog({
  open,
  onOpenChange,
  member,
  onDeleted,
}: MemberDialogProps) {
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

  useEffect(() => {
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

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: MemberFormValues) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, value == null ? "" : String(value));
    }

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
    if (!member) {
      return;
    }
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
    <Dialog onOpenChange={onOpenChange} open={open}>
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
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    <Textarea
                      {...field}
                      placeholder="Quick introduction"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex items-center justify-between gap-2 sm:flex-row">
              {member ? (
                <Button
                  disabled={isPending}
                  onClick={onDelete}
                  type="button"
                  variant="destructive"
                >
                  Remove
                </Button>
              ) : (
                <span />
              )}
              <Button disabled={isPending} type="submit">
                {member ? "Save changes" : "Invite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
