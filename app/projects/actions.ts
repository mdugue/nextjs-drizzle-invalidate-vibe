"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type { z } from "zod";
import { db } from "@/lib/db";
import { PROJECT_DETAIL_TAG, PROJECT_LIST_TAG } from "@/lib/queries";
import { projects } from "@/lib/schema";
import { projectFormSchema } from "@/lib/zod";

function parseFormData<T>(schema: z.ZodSchema<T>, formData: FormData): T {
  const result = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    throw new Error(result.error.flatten().formErrors.join("\n"));
  }
  return result.data;
}

export async function createProject(formData: FormData) {
  const values = parseFormData(projectFormSchema, formData);
  await db.insert(projects).values(values);
  revalidateTag(PROJECT_LIST_TAG);
}

export async function updateProject(id: number, formData: FormData) {
  const values = parseFormData(projectFormSchema, formData);
  await db.update(projects).set(values).where(eq(projects.id, id));
  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
}
