"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { memberFormSchema } from "@/lib/zod";
import { members } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { MEMBER_DETAIL_TAG, MEMBER_LIST_TAG } from "@/lib/queries";

function parseFormData<T>(schema: z.ZodSchema<T>, formData: FormData): T {
  const result = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    throw new Error(result.error.flatten().formErrors.join("\n"));
  }
  return result.data;
}

export async function createMember(formData: FormData) {
  const values = parseFormData(memberFormSchema, formData);
  await db.insert(members).values(values).run();
  revalidateTag(MEMBER_LIST_TAG);
}

export async function updateMember(id: number, formData: FormData) {
  const values = parseFormData(memberFormSchema, formData);
  await db.update(members).set(values).where(eq(members.id, id)).run();
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
}

export async function deleteMember(id: number) {
  await db.delete(members).where(eq(members.id, id)).run();
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
}
