"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type { z } from "zod";
import { db } from "@/lib/db";
import { TICKET_DETAIL_TAG, TICKET_LIST_TAG } from "@/lib/queries";
import { tickets } from "@/lib/schema";
import { ticketFormSchema } from "@/lib/zod";

function parseFormData<T>(schema: z.ZodSchema<T>, formData: FormData): T {
  const result = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    throw new Error(result.error.flatten().formErrors.join("\n"));
  }
  return result.data;
}

export async function createTicket(formData: FormData) {
  const values = parseFormData(ticketFormSchema, formData);
  await db.insert(tickets).values(values);
  revalidateTag(TICKET_LIST_TAG);
}

export async function updateTicket(id: number, formData: FormData) {
  const values = parseFormData(ticketFormSchema, formData);
  await db.update(tickets).set(values).where(eq(tickets.id, id));
  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
}

export async function deleteTicket(id: number) {
  await db.delete(tickets).where(eq(tickets.id, id));
  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
}
