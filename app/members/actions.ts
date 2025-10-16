"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type { z } from "zod";
import { db } from "@/lib/db";
import { MEMBER_DETAIL_TAG, MEMBER_LIST_TAG } from "@/lib/queries";
import { members } from "@/lib/schema";
import { memberFormSchema } from "@/lib/zod";

function parseFormData<T>(schema: z.ZodSchema<T>, formData: FormData): T {
  const result = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    throw new Error(result.error.flatten().formErrors.join("\n"));
  }
  return result.data;
}

export async function createMember(formData: FormData) {
  const values = parseFormData(memberFormSchema, formData);
  await db.insert(members).values(values);
  revalidateTag(MEMBER_LIST_TAG);
}

export async function updateMember(id: number, formData: FormData) {
  const values = parseFormData(memberFormSchema, formData);
  await db.update(members).set(values).where(eq(members.id, id));
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
}

export async function deleteMember(id: number) {
  await db.delete(members).where(eq(members.id, id));
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
}
