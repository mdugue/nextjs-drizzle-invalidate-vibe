"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { TICKET_DETAIL_TAG, TICKET_LIST_TAG } from "@/lib/queries";
import { tickets } from "@/lib/schema";
import { type TicketFormValues, ticketFormSchema } from "@/lib/zod";

export async function createTicket(values: TicketFormValues) {
  const validated = ticketFormSchema.parse(values);
  await db.insert(tickets).values(validated);
  revalidateTag(TICKET_LIST_TAG);
}

export async function updateTicket(id: number, values: TicketFormValues) {
  const validated = ticketFormSchema.parse(values);
  await db.update(tickets).set(validated).where(eq(tickets.id, id));
  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
}

export async function deleteTicket(id: number) {
  await db.delete(tickets).where(eq(tickets.id, id));
  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
}
