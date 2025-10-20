"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { Textarea } from "@/app/components/ui/textarea";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/app/projects/actions";
import { type Project, projectStatus } from "@/lib/schema";
import { type ProjectFormValues, projectFormSchema } from "@/lib/zod";

type ProjectSheetProps = {
  project?: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (id: number) => void;
};

export function ProjectSheet({
  project,
  open,
  onOpenChange,
  onDeleted,
}: ProjectSheetProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      status: "planned",
    },
    values: project
      ? {
          slug: project.slug,
          title: project.title,
          description: project.description ?? "",
          status: project.status,
          owner: project.owner ?? undefined,
        }
      : undefined,
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        slug: "",
        title: "",
        description: "",
        status: "planned",
      });
    }
  }, [open, form]);

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: ProjectFormValues) => {
    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, values)
        : await createProject(values);

      if (!result.success) {
        // Map errors to form fields
        for (const [field, message] of Object.entries(result.errors)) {
          if (field === "_form") {
            toast.error(message);
          } else {
            form.setError(field as keyof ProjectFormValues, { message });
          }
        }
        return;
      }

      toast.success(project ? "Project updated" : "Project created");
      onOpenChange(false);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!project) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProject(project.id);

      if (!result.success) {
        toast.error(result.errors._form ?? "Failed to delete project");
        return;
      }

      toast.success("Project deleted");
      onDeleted?.(project.id);
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex flex-col gap-6" side="right">
        <SheetHeader>
          <SheetTitle>{project ? project.title : "Create project"}</SheetTitle>
          <SheetDescription>
            {project
              ? "Update project metadata and status"
              : "Fill the form to add a new initiative."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="flex flex-1 flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Project name" />
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
                    <Input {...field} placeholder="unique-slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Short summary" rows={4} />
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
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectStatus.map((status) => (
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
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Owner name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-auto flex items-center justify-between">
              {project ? (
                <Button
                  disabled={isPending}
                  onClick={onDelete}
                  type="button"
                  variant="destructive"
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <Button disabled={isPending} type="submit">
                {project ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
}
