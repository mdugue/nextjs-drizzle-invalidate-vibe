import { z } from "zod";
import { memberStatus, projectStatus, ticketStatus } from "@/lib/schema";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const basePaginationSchema = z.object({
  cursor: z.string().optional(),
  direction: z.enum(["forward", "backward"]).optional(),
});

export const projectFormSchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(slugRegex, "Use lowercase letters, numbers and dashes"),
  title: z.string().min(3),
  description: z.string().optional(),
  status: z.enum(projectStatus),
  owner: z.string().min(3),
});

const projectIdField = z.preprocess((value) => {
  if (
    value === "" ||
    value === "null" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }
  return value;
}, z.coerce.number().nullable());

export const ticketFormSchema = z.object({
  slug: z.string().min(3).regex(slugRegex),
  title: z.string().min(3),
  summary: z.string().min(3),
  status: z.enum(ticketStatus),
  projectId: projectIdField,
  assignee: z.string().optional(),
});

export const memberFormSchema = z.object({
  slug: z.string().min(3).regex(slugRegex),
  name: z.string().min(3),
  email: z.string().email(),
  status: z.enum(memberStatus),
  bio: z.string().optional(),
  role: z.string().min(2),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type TicketFormValues = z.infer<typeof ticketFormSchema>;
export type MemberFormValues = z.infer<typeof memberFormSchema>;
