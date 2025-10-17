"use server";

import { eq, max } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import {
  TICKET_DETAIL_TAG,
  TICKET_LIST_TAG,
  TICKET_VERSION_TAG,
} from "@/lib/queries";
import { tickets, ticketsHistory } from "@/lib/schema";
import {
  compareTicketVersions,
  getTicketVersions,
  restoreTicketVersion,
} from "@/lib/versioning";
import { type TicketFormValues, ticketFormSchema } from "@/lib/zod";

export async function createTicket(values: TicketFormValues) {
  const validated = ticketFormSchema.parse(values);
  await db.insert(tickets).values(validated);
  revalidateTag(TICKET_LIST_TAG);
}

export async function updateTicket(id: number, values: TicketFormValues) {
  const validated = ticketFormSchema.parse(values);

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (current) {
      const versionNumber =
        (await tx
          .select({ max: max(ticketsHistory.versionNumber) })
          .from(ticketsHistory)
          .where(eq(ticketsHistory.entityId, id))
          .limit(1)
          .then((r) => r[0]?.max)) ?? 0;

      await tx.insert(ticketsHistory).values({
        entityId: id,
        versionNumber: versionNumber + 1,
        changedAt: new Date(),
        slug: current.slug,
        title: current.title,
        summary: current.summary ?? null,
        status: current.status,
        projectId: current.projectId ?? null,
        assignee: current.assignee ?? null,
        createdAt: current.createdAt,
      });
    }

    await tx.update(tickets).set(validated).where(eq(tickets.id, id));
  });

  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
  revalidateTag(TICKET_VERSION_TAG(id));
}

export async function deleteTicket(id: number) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (current) {
      const versionNumber =
        (await tx
          .select({ max: max(ticketsHistory.versionNumber) })
          .from(ticketsHistory)
          .where(eq(ticketsHistory.entityId, id))
          .limit(1)
          .then((r) => r[0]?.max)) ?? 0;

      await tx.insert(ticketsHistory).values({
        entityId: id,
        versionNumber: versionNumber + 1,
        changedAt: new Date(),
        slug: current.slug,
        title: current.title,
        summary: current.summary ?? null,
        status: current.status,
        projectId: current.projectId ?? null,
        assignee: current.assignee ?? null,
        createdAt: current.createdAt,
      });
    }

    await tx
      .update(tickets)
      .set({ deletedAt: new Date() })
      .where(eq(tickets.id, id));
  });

  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
  revalidateTag(TICKET_VERSION_TAG(id));
}

export async function restoreTicket(id: number, versionNumber: number) {
  await restoreTicketVersion(id, versionNumber);
  revalidateTag(TICKET_LIST_TAG);
  revalidateTag(TICKET_DETAIL_TAG(id));
  revalidateTag(TICKET_VERSION_TAG(id));
}

export async function getTicketVersionHistory(id: number) {
  return await getTicketVersions(id);
}

export async function getTicketVersionDiff(
  id: number,
  fromVersion: number,
  toVersion: number
) {
  return await compareTicketVersions(id, fromVersion, toVersion);
}
