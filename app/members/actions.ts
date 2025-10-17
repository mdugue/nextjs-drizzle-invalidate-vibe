"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { MEMBER_DETAIL_TAG, MEMBER_LIST_TAG } from "@/lib/queries";
import { members } from "@/lib/schema";
import { type MemberFormValues, memberFormSchema } from "@/lib/zod";

export async function createMember(values: MemberFormValues) {
  const validated = memberFormSchema.parse(values);
  await db.insert(members).values(validated);
  revalidateTag(MEMBER_LIST_TAG);
}

export async function updateMember(id: number, values: MemberFormValues) {
  const validated = memberFormSchema.parse(values);
  await db.update(members).set(validated).where(eq(members.id, id));
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
}

export async function deleteMember(id: number) {
  await db.delete(members).where(eq(members.id, id));
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
}
