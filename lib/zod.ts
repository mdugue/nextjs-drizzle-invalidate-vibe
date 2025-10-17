import { z } from "zod";
import { memberStatus, projectStatus, ticketStatus } from "@/lib/schema";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_SLUG_LENGTH = 3;
const MIN_TEXT_LENGTH = 3;
const MIN_ROLE_LENGTH = 2;

export const basePaginationSchema = z.object({
  cursor: z.string().optional(),
  direction: z.enum(["forward", "backward"]).optional(),
});

export const projectFormSchema = z.object({
  slug: z
    .string()
    .min(MIN_SLUG_LENGTH)
    .regex(slugRegex, "Use lowercase letters, numbers and dashes"),
  title: z.string().min(MIN_TEXT_LENGTH),
  description: z.string().optional(),
  status: z.enum(projectStatus),
  owner: z.string().min(MIN_TEXT_LENGTH),
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
  slug: z.string().min(MIN_SLUG_LENGTH).regex(slugRegex),
  title: z.string().min(MIN_TEXT_LENGTH),
  summary: z.string().min(MIN_TEXT_LENGTH),
  status: z.enum(ticketStatus),
  projectId: projectIdField,
  assignee: z.string().optional(),
});

export const memberFormSchema = z.object({
  slug: z.string().min(MIN_SLUG_LENGTH).regex(slugRegex),
  name: z.string().min(MIN_TEXT_LENGTH),
  email: z.string().email(),
  status: z.enum(memberStatus),
  bio: z.string().optional(),
  role: z.string().min(MIN_ROLE_LENGTH),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type TicketFormInput = z.input<typeof ticketFormSchema>;
export type TicketFormValues = z.output<typeof ticketFormSchema>;
export type MemberFormValues = z.infer<typeof memberFormSchema>;
